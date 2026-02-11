package com.barberapp.backend.service;

import com.barberapp.backend.dto.AppointmentDTO;
import com.barberapp.backend.model.Appointment;
import com.barberapp.backend.model.AppointmentStatus;
import com.barberapp.backend.model.User;
import com.barberapp.backend.model.Specialty;
import com.barberapp.backend.repository.AppointmentRepository;
import com.barberapp.backend.repository.SpecialtyRepository;
import com.barberapp.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AppointmentService {

    private final AppointmentRepository appointmentRepository;
    private final UserRepository userRepository;
    private final SpecialtyRepository specialtyRepository;

    public AppointmentDTO createAppointment(AppointmentDTO dto) {
        // 1. Validar se o Cliente (User) existe no banco
        User client = userRepository.findById(dto.getClientId())
                .orElseThrow(() -> new RuntimeException("Client not found with ID: " + dto.getClientId()));

        // 2. Validar se o Barbeiro (User) existe no banco
        User barber = userRepository.findById(dto.getBarberId())
                .orElseThrow(() -> new RuntimeException("Barber not found with ID: " + dto.getBarberId()));

        // 3. Validar se a Especialidade existe
        Specialty specialty = specialtyRepository.findById(dto.getSpecialtyId())
                .orElseThrow(() -> new RuntimeException("Specialty not found with ID: " + dto.getSpecialtyId()));

        // 4. Transformar DTO em Entidade (Montar o objeto para salvar)
        Appointment appointment = Appointment.builder()
                .date(dto.getDate())
                .status(AppointmentStatus.PENDING) // Todo agendamento começa como Pendente
                .client(client)
                .barber(barber)
                .specialty(specialty)
                .build();

        // 5. Salvar no Banco de Dados
        Appointment savedAppointment = appointmentRepository.save(appointment);

        // 6. Devolver as informações confirmadas (convertendo de volta para DTO)
        return convertToDTO(savedAppointment);
    }

    public List<AppointmentDTO> listAllAppointments() {
        // Busca tudo do banco e converte cada um para DTO
        return appointmentRepository.findAll().stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    // Método auxiliar para não repetir código
    private AppointmentDTO convertToDTO(Appointment appointment) {
        return AppointmentDTO.builder()
                .id(appointment.getId())
                .date(appointment.getDate())
                .status(appointment.getStatus())
                .clientId(appointment.getClient().getId())
                .clientName(appointment.getClient().getName()) // Extra: Mandamos o nome para facilitar no Front
                .barberId(appointment.getBarber().getId())
                .barberName(appointment.getBarber().getName())
                .specialtyId(appointment.getSpecialty().getId())
                .specialtyName(appointment.getSpecialty().getName())
                .build();
    }
}