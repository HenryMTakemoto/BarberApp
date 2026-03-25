package com.barberapp.backend.config;

import com.barberapp.backend.model.*;
import com.barberapp.backend.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.List;

// Comentado para evitar a injeção duplicada ao reiniciar a aplicação
// @Component
@RequiredArgsConstructor
public class DummyDataSeeder implements CommandLineRunner {

    private final UserRepository userRepository;
    private final ServiceRepository serviceRepository;
    private final AppointmentRepository appointmentRepository;
    private final SpecialtyRepository specialtyRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    @Transactional
    public void run(String... args) throws Exception {
        if (userRepository.findByEmail("b1@test.com").isPresent() || userRepository.findByEmail("c1@test.com").isPresent()) {
            System.out.println(">>> SEEDER IGNORADO: O banco já tem os dados de teste.");
            return;
        }

        System.out.println(">>> INICIANDO INJEÇÃO MASSIVA DE DADOS DE TESTE...");

        Specialty spec1 = createSpec("Navalhado");
        Specialty spec2 = createSpec("Degradê");
        Specialty spec3 = createSpec("Afro");
        Specialty spec4 = createSpec("Coloração");
        Specialty spec5 = createSpec("Tranças");
        Specialty spec6 = createSpec("Clássico");

        // Barbeiros
        User b1 = createBarber("Barber Navalha SP", "b1@test.com", -23.5550, -46.6300, List.of(spec1));
        BarberService s1 = createService(b1, "Navalhado Premium", 40.0, 30);
        
        User b2 = createBarber("Studio Degradê", "b2@test.com", -23.6000, -46.6800, List.of(spec2, spec4));
        BarberService s2 = createService(b2, "Degradê Completo", 35.0, 40);

        User b3 = createBarber("Afro Roots", "b3@test.com", -23.6200, -46.7200, List.of(spec3, spec5));
        BarberService s3 = createService(b3, "Corte Afro", 45.0, 45);

        User b4 = createBarber("Barbearia Longe", "b4@test.com", -23.8000, -46.9000, List.of(spec6));
        BarberService s4 = createService(b4, "Corte Clássico", 30.0, 30);

        // Clientes
        User c1 = createClient("Cliente Teste 1", "c1@test.com", -23.5505, -46.6333);
        User c2 = createClient("Cliente Teste 2", "c2@test.com", -23.5505, -46.6333);

        // Historico para C1
        createAppointment(c1, b2, s2, LocalDateTime.now().minusDays(10));
        createAppointment(c1, b2, s2, LocalDateTime.now().minusDays(20));

        // Historico para C2
        createAppointment(c2, b3, s3, LocalDateTime.now().minusDays(15));
        createAppointment(c2, b3, s3, LocalDateTime.now().minusDays(30));

        // Historico p/ Consultor IA de B1
        for (int i = 1; i <= 10; i++) {
            createAppointment(c1, b1, s1, LocalDateTime.now().minusDays(i));
        }

        System.out.println(">>> DADOS INJETADOS COM SUCESSO! Faça login com c1@test.com ou b1@test.com com a senha 123456.");
    }

    private Specialty createSpec(String name) {
        return specialtyRepository.findByName(name).orElseGet(() -> {
            Specialty s = new Specialty();
            s.setName(name);
            return specialtyRepository.save(s);
        });
    }

    private BarberService createService(User barber, String name, double price, int duration) {
        BarberService s = new BarberService();
        s.setBarber(barber);
        s.setName(name);
        s.setPrice(price);
        s.setDurationMinutes(duration);
        return serviceRepository.save(s);
    }

    private User createBarber(String name, String email, double lat, double lng, List<Specialty> specs) {
        Address addr = new Address();
        addr.setStreet("Rua " + name);
        addr.setNumber("123");
        addr.setCity("SP");
        addr.setState("SP");
        addr.setZipCode("01000");
        addr.setLatitude(lat);
        addr.setLongitude(lng);

        User u = new User();
        u.setName(name);
        u.setEmail(email);
        u.setPassword(passwordEncoder.encode("123456"));
        u.setPhoneNumber("1199999999");
        u.setRole(Role.BARBER);
        u.setSpecialties(new HashSet<>(specs));
        u.setAddress(addr);
        return userRepository.save(u);
    }

    private User createClient(String name, String email, double lat, double lng) {
        Address addr = new Address();
        addr.setStreet("Av " + name);
        addr.setNumber("123");
        addr.setCity("SP");
        addr.setState("SP");
        addr.setZipCode("01000");
        addr.setLatitude(lat);
        addr.setLongitude(lng);

        User u = new User();
        u.setName(name);
        u.setEmail(email);
        u.setPassword(passwordEncoder.encode("123456"));
        u.setPhoneNumber("1199999999");
        u.setRole(Role.CLIENT);
        u.setAddress(addr);
        return userRepository.save(u);
    }

    private void createAppointment(User client, User barber, BarberService service, LocalDateTime date) {
        Appointment a = new Appointment();
        a.setClient(client);
        a.setBarber(barber);
        a.setService(service);
        a.setDate(date);
        a.setStatus(AppointmentStatus.COMPLETED);
        appointmentRepository.save(a);
    }
}
