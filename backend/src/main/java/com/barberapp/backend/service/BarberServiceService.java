package com.barberapp.backend.service;

import com.barberapp.backend.dto.ServiceDTO;
import com.barberapp.backend.model.BarberService;
import com.barberapp.backend.model.User;
import com.barberapp.backend.repository.ServiceRepository;
import com.barberapp.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class BarberServiceService {

    private final ServiceRepository serviceRepository;
    private final UserRepository userRepository;

    public List<ServiceDTO> getByBarberId(Long barberId) {
        return serviceRepository.findByBarberId(barberId)
                .stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    public ServiceDTO create(Long barberId, ServiceDTO dto) {
        User barber = userRepository.findById(barberId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Barber not found with id: " + barberId));

        BarberService service = BarberService.builder()
                .name(dto.getName())
                .durationMinutes(dto.getDurationMinutes())
                .price(dto.getPrice())
                .barber(barber)
                .build();

        return convertToDTO(serviceRepository.save(service));
    }

    public ServiceDTO update(Long serviceId, ServiceDTO dto) {
        BarberService service = serviceRepository.findById(serviceId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Service not found with id: " + serviceId));

        service.setName(dto.getName());
        service.setDurationMinutes(dto.getDurationMinutes());
        service.setPrice(dto.getPrice());

        return convertToDTO(serviceRepository.save(service));
    }

    public void delete(Long serviceId) {
        if (!serviceRepository.existsById(serviceId)) {
            throw new ResponseStatusException(
                    HttpStatus.NOT_FOUND, "Service not found with id: " + serviceId);
        }
        serviceRepository.deleteById(serviceId);
    }

    private ServiceDTO convertToDTO(BarberService service) {
        return ServiceDTO.builder()
                .id(service.getId())
                .name(service.getName())
                .durationMinutes(service.getDurationMinutes())
                .price(service.getPrice())
                .barberId(service.getBarber().getId())
                .barberName(service.getBarber().getName())
                .build();
    }
}