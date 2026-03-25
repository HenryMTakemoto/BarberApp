package com.barberapp.backend.service;

import com.barberapp.backend.model.Appointment;
import com.barberapp.backend.model.AppointmentStatus;
import com.barberapp.backend.model.User;
import com.barberapp.backend.dto.UserDTO;
import com.barberapp.backend.repository.AppointmentRepository;
import com.barberapp.backend.repository.UserRepository;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AiInsightsService {

    private final AppointmentRepository appointmentRepository;
    private final UserRepository userRepository;
    private final UserService userService;

    @Value("${groq.api.key}")
    private String groqApiKey;

    @Value("${groq.api.url}")
    private String groqApiUrl;

    private final RestTemplate restTemplate = new RestTemplate();
    private final ObjectMapper objectMapper = new ObjectMapper();

    public List<String> getBarberInsights(Long barberId) {
        UserDTO barber = userService.getUserById(barberId);

        List<Appointment> allAppointments = appointmentRepository.findByBarberIdOrderByDateAsc(barberId);

        long totalAppointments = allAppointments.size();
        long completed = allAppointments.stream().filter(a -> a.getStatus() == AppointmentStatus.COMPLETED).count();
        double totalRevenue = allAppointments.stream()
                .filter(a -> a.getStatus() == AppointmentStatus.COMPLETED)
                .mapToDouble(a -> a.getService() != null ? a.getService().getPrice() : 0.0)
                .sum();

        Map<String, Long> serviceCounts = allAppointments.stream()
                .filter(a -> a.getService() != null)
                .collect(Collectors.groupingBy(a -> a.getService().getName(), Collectors.counting()));

        String specialties = barber.getSpecialties() != null ? String.join(", ", barber.getSpecialties()) : "";
        Double rating = barber.getRating() != null ? barber.getRating() : 0.0;
        Long reviews = barber.getReviewCount() != null ? barber.getReviewCount() : 0L;

        String serviceCountsStr = "Nenhum";
        try {
            if (!serviceCounts.isEmpty()) serviceCountsStr = objectMapper.writeValueAsString(serviceCounts);
        } catch (Exception e) {}

        String prompt = String.format(
                "Você é um consultor de negócios focado em barbearias de sucesso. Um barbeiro chamado %s tem os seguintes dados recentes: " +
                        "\nEspecialidades: %s. \nAvaliação: %.1f estrelas (com base em %d avaliações). " +
                        "\nHistórico recente: Agendamentos totais: %d (Concluídos com sucesso: %d). " +
                        "\nFaturamento estimado: R$ %.2f. \nServiços mais populares (JSON): %s. " +
                        "\nCom base DESSES dados específicos, dê 3 dicas curtas, originais e muito práticas (máximo 1 frase cada) sobre como ele pode atrair mais clientes ou melhorar o negócio. Se os dados forem 0, foque em estratégias iniciais (como promoções, portfólio no app e redes sociais)."
                        +
                        "\nRetorne EXATAMENTE um objeto JSON no seguinte formato: {\"dicas\": [\"dica 1\", \"dica 2\", \"dica 3\"]}. "
                        +
                        "Não adicione texto adicional, não use marcações de código, apenas o JSON puramente.",
                barber.getName(), specialties, rating, reviews, totalAppointments, completed, totalRevenue, serviceCountsStr);

        String jsonResponse = callGroqApi(prompt);
        return parseStringList(jsonResponse);
    }

    public Map<String, Object> getClientRecommendation(Long clientId, Double lat, Double lng) {
        UserDTO client = userService.getUserById(clientId);

        List<Appointment> history = appointmentRepository.findByClientIdOrderByDateDesc(clientId);
        String historySummary = "Nenhum histórico";
        if (!history.isEmpty()) {
            Map<String, Long> serviceCounts = history.stream()
                    .filter(a -> a.getService() != null)
                    .collect(Collectors.groupingBy(a -> a.getService().getName(), Collectors.counting()));
            historySummary = serviceCounts.toString();
        }

        // Get barbers up to 50km
        List<UserDTO> nearbyBarbersUsers = userService.getNearbyBarbers(lat, lng, 50.0, null);

        if (nearbyBarbersUsers.isEmpty()) {
            Map<String, Object> fallback = new HashMap<>();
            fallback.put("recommendedBarberId", null);
            fallback.put("reason", "Ainda não há barbeiros cadastrados na sua região. Que tal convidar o seu barbeiro?");
            return fallback;
        }

        List<Map<String, Object>> barbersData = nearbyBarbersUsers.stream().limit(10).map(b -> {
            Map<String, Object> map = new HashMap<>();
            map.put("id", b.getId());
            map.put("name", b.getName());
            map.put("rating", b.getRating());
            map.put("specialties", b.getSpecialties());
            return map;
        }).collect(Collectors.toList());

        String barbersDataStr = "[]";
        try {
            barbersDataStr = objectMapper.writeValueAsString(barbersData);
        } catch (Exception e) {}

        String prompt = String.format(
                "Você é um assistente recomendador de barbearias Premium. O cliente %s está buscando um barbeiro em um novo app. " +
                        "O histórico de serviços procurados por ele no passado no app é: %s. " +
                        "Os barbeiros disponíveis próximos a ele são apresentados neste JSON: %s. " +
                        "Analise os barbeiros. Escolha APENAS 1 barbeiro que seria a melhor combinação para ele com base no histórico (ou no melhor avaliado se não tiver histórico). E crie uma recomendação chamativa de 1 frase (máximo 120 caracteres) diretamente para o cliente, convencendo-o a ir nele."
                        +
                        "Retorne EXATAMENTE um JSON puramente com as chaves 'recommendedBarberId' (número) e 'reason' (string com a frase incrível de recomendação). Sem marcação markdown ou texto extra.",
                client.getName(), historySummary, barbersDataStr);

        String jsonResponse = callGroqApi(prompt);
        System.out.println(">>> GROQ CLIENT PROMPT ENVIADO <<<");
        System.out.println(">>> GROQ CLIENT RESPONSE RECEBIDA: " + jsonResponse);
        return parseObjectMap(jsonResponse);
    }

    private String callGroqApi(String prompt) {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.setBearerAuth(groqApiKey);

        Map<String, Object> message = new HashMap<>();
        message.put("role", "user");
        message.put("content", prompt);

        Map<String, Object> requestBody = new HashMap<>();
        requestBody.put("model", "llama-3.3-70b-versatile");
        requestBody.put("messages", Collections.singletonList(message));
        requestBody.put("temperature", 0.7);
        requestBody.put("response_format", Map.of("type", "json_object"));

        HttpEntity<Map<String, Object>> request = new HttpEntity<>(requestBody, headers);

        try {
            ResponseEntity<String> response = restTemplate.postForEntity(groqApiUrl, request, String.class);
            if (response.getStatusCode() == HttpStatus.OK && response.getBody() != null) {
                JsonNode root = objectMapper.readTree(response.getBody());
                String contentResult = root.path("choices").get(0).path("message").path("content").asText();
                // Return only the JSON part from markdown block if mistakenly inserted by AI
                if (contentResult.contains("```json")) {
                    contentResult = contentResult.substring(contentResult.indexOf("```json") + 7);
                    if (contentResult.contains("```")) {
                        contentResult = contentResult.substring(0, contentResult.indexOf("```"));
                    }
                }
                return contentResult;
            }
        } catch (Exception e) {
            System.err.println("Groq API Error: " + e.getMessage());
        }
        return "{}";
    }

    private List<String> parseStringList(String content) {
        try {
            // Groq may return text formatted as ```json [...] ```
            String cleanJson = content.replace("```json", "").replace("```", "").trim();
            JsonNode node = objectMapper.readTree(cleanJson);
            List<String> result = new ArrayList<>();
            JsonNode dicasNode = node.path("dicas");
            if (dicasNode.isArray()) {
                for (JsonNode n : dicasNode) {
                    result.add(n.asText());
                }
            } else if (node.isArray()) {
                for (JsonNode n : node) {
                    result.add(n.asText());
                }
            }
            if (result.isEmpty())
                result.add("Tente ser mais ativo nas redes sociais."); // Fallback
            return result;
        } catch (Exception e) {
            return Collections.singletonList("Concentre-se em oferecer um ótimo atendimento ao cliente."); // Fallback
        }
    }

    private Map<String, Object> parseObjectMap(String content) {
        Map<String, Object> result = new HashMap<>();
        try {
            String cleanJson = content.replace("```json", "").replace("```", "").trim();
            JsonNode node = objectMapper.readTree(cleanJson);
            
            JsonNode idNode = node.path("recommendedBarberId");
            if (idNode.isMissingNode() || idNode.isNull()) idNode = node.path("id");
            if (idNode.isMissingNode() || idNode.isNull()) idNode = node.path("barberId");
            
            long barberId = idNode.asLong(0); // 0 fallback
            
            JsonNode reasonNode = node.path("reason");
            if (reasonNode.isMissingNode() || reasonNode.isNull()) reasonNode = node.path("motivo");
            if (reasonNode.isMissingNode() || reasonNode.isNull()) reasonNode = node.path("descricao");
            
            String reason = reasonNode.asText("Esta barbearia combina perfeitamente com você!");
            
            result.put("recommendedBarberId", barberId == 0 ? null : barberId);
            result.put("reason", reason);
            
            System.out.println(">>> PARSED AS: ID=" + barberId + ", REASON=" + reason);
            return result;
        } catch (Exception e) {
            System.err.println(">>> FALHA AO FAZER PARSE DO JSON DO GROQ: " + e.getMessage() + ". Original JSON: " + content);
            result.put("recommendedBarberId", null);
            result.put("reason", "Descubra os melhores profissionais na sua região!");
            return result;
        }
    }
}
