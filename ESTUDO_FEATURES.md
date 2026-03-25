# Guia de Estudo: Funcionalidades do BarberApp

Este documento detalha o fluxo completo das 5 funcionalidades avançadas implementadas no aplicativo. Criei este arquivo para que você possa entender, revisar e estudar a arquitetura do projeto passo a passo.

---

## 1. Notificações Push para Clientes (Lembrete)
**Objetivo:** Avisar o cliente que o agendamento dele está próximo (faltando 1 hora).

### Fluxo Passo a Passo:
1. **Frontend (Expo):** Quando o cliente abre o app ou faz login, o `ExpoNotificationService` aciona o hook do dispositivo para perguntar se ele permite receber notificações.
2. Ao permitir, a API do Expo gera um `ExpoPushToken` único que identifica aquele aparelho.
3. O App chama a atualização de perfil `PUT /api/users/{id}` para salvar esse Token no banco de dados (`push_token` no modelo `User`).
4. **Backend (Spring Boot):** Existe um robô agendado (`NotificationScheduler.java`) configurado com a anotação `@Scheduled(cron = "0 * * * * *")` para rodar a cada 1 minuto.
5. Ele busca todos os agendamentos (`Appointment`) cujo status é PENDENTE e que o horário marcado é exatamente daqui a 1 hora (entre 60 e 61 minutos).
6. Para cada agendamento encontrado, ele chama a API pública do Expo (`https://exp.host/--/api/v2/push/send`) enviando o token do cliente salvo no banco e uma mensagem amigável ("Lembrete: Seu corte é daqui a 1 hora!").
7. O celular do cliente recebe o Push nativo na tela.

---

## 2. Agenda Extensa (Visão de 30 Dias)
**Objetivo:** Permitir que clientes agendem horários não apenas na mesma semana, mas nos próximos 30 dias.

### Fluxo Passo a Passo:
1. **Frontend (`BookingScreen.tsx`):** A função de gerar dias foi estendida de 7 para 30 ou mais dias a partir de "Hoje" usando um `Array.from`.
2. Assim, ao carregar a tela do barbeiro, o scrollView horizontal renderiza blocos de 30 dias contínuos.
3. Quando o usuário clica em qualquer dia, chamamos `GET /api/barbers/{id}/availability?date=YYYY-MM-DD`.
4. **Backend:** O backend já possuía uma lógica robusta em `AppointmentService` que pega a data escolhida, avalia os horários da barbearia configurados para aquele dia da semana, remove os slots (horários) que já tem `Appointments` e devolve a lista de vagas limpa para o front. Foi apenas questão de flexibilizar o limite no frontend!

---

## 3. Inteligência Artificial com Llama 3 (Groq API)
**Objetivo:** Oferecer dicas de negócios de IA aos profissionais e recomendar barbeiros automaticamente aos clientes.

### Fluxo Passo a Passo.
1. **Conexão:** Cadastramos a variável `GROQ_API_KEY` para o `AiInsightsService` conversar pela web com o LLM hospedado no data center da Groq.
2. **Recomendação para Clientes (`ExploreScreen`):**
   - O aplicativo envia suas coordenadas de GPS pro backend solicitando uma recomendação da IA.
   - O backend busca seu histórico de cortes e os barbeiros num raio de 50km.
   - Monta um "Prompt" (comando) pedindo para a IA ler 10 barbeiros JSON (nome, avaliações, especialidades) e achar um que combine com você.
   - A IA nos devolve exatamente dois parâmetros num JSON: `{"recommendedBarberId": X, "reason": "Sua frase"}`.
   - O Spring envia e o React renderiza a caixinha especial na tela inicial!
3. **Analista de Negócios para Barbeiros (`BarberInsightsScreen`):**
   - Na tela de Ganhos, o barbeiro solicita Dicas.
   - O backend reune o total de ganhos diários, histórico de avaliações, os serviços mais vendidos e especialidades nativas.
   - Tudo isso forma um relatório enviado pro `llama-3.3-70b-versatile` que é instruído a dar 3 dicas objetivas em formato JSON Array (lista).
   - O aplicativo converte as dicas pra 3 "Cards" interativos no seu modal.

---

## 4. Toggle "Disponível/Indisponível" (Disponibilidade Online)
**Objetivo:** Permitir que barbeiros sumam temporariamente do mapa de clientes sem excluir sua conta e horários preexistentes.

### Fluxo Passo a Passo.
1. **Banco de Dados e Model:** Adicionamos a coluna `isOnline` (`Boolean`, default `true`) na Entidade `User`. Atualizamos o `UserDTO` e `UpdateUserRequest` para transportar essa informação.
2. **Backend (Filtro Inteligente):**
   - Exigimos uma consulta nativa SQL `@Query` inteligente dentro de `UserRepository`. A regra agora é: O barbeiro só aparece na busca por distâncias e no radar SE o atributo `is_online = true`.
3. **Frontend (`BarberProfileEditScreen`):**
   - Incluímos um botão (Toggle). Sempre que é tocado, imediatamente chamamos `PUT /api/users/{id}` alterando apenas `isOnline`, o que reflete magicamente escondendo-o da busca dos clientes da cidade. 

---

## 5. Upload de Imagem de Perfil 
**Objetivo:** Permitir que Barbeiros e Clientes personalizem o seu perfil trocando a foto com acesso nativo à câmera/galeria de imagens.

### Fluxo Passo a Passo.
1. **Frontend (`expo-image-picker`):** A biblioteca acessa a galeria de mídia do celular ou emulador e extrai dados binários do arquivo gerando um URI (caminho em memória).
2. O React monta um pacote `multipart/form-data` e envia a requisição POST para `/api/upload`.
3. **Backend (`UploadController`):**
   - Recebe o bloco de arquivo via Java Spring (`MultipartFile`), cria um nome seguro e único com UUID.
   - Salva a imagem física numa pasta local na raiz chamada `/uploads`.
   - Gera um URL público (ex: `http://localhost:8080/uploads/foto.jpg`) e retonar no JSON.
4. O `WebConfig.java` recebe ordens explícitas pra permitir quem bater na porta `/uploads/**` acessar arquivos parciais como estáticos. Securidade está contornada permitindo POST nesse acesso `.requestMatchers(HttpMethod.POST, "/api/upload").permitAll()`.
5. O Front pega o link final, chama a requisição usual PUT pra atualizar no banco `avatarUrl: url` e substitui na hora no visual do seu perfil!

---
> Se preferir parar de carregar os Dados Fakes de inicialização (`DummyDataSeeder`), você não precisa apagar o arquivo. Apenas coloque um comentário na anotação `@Component` do arquivo Java. Ex: `// @Component`.
