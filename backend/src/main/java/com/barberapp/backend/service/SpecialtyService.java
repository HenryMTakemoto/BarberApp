package com.barberapp.backend.service;

import com.barberapp.backend.model.Specialty;
import com.barberapp.backend.dto.SpecialtyDTO;
import com.barberapp.backend.repository.SpecialtyRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class SpecialtyService {

    private final SpecialtyRepository specialtyRepository;

    // Listar as especialidades
    public List<SpecialtyDTO> getAllSpecialties() {
        return specialtyRepository.findAll().stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    // Criar nova especialidade
    public SpecialtyDTO createSpecialty(SpecialtyDTO specialtyDTO) {
        // Validação : Não permitir nomes duplicados
        if (specialtyRepository.findByName(specialtyDTO.getName()).isPresent()) {
            throw new RuntimeException("Specialty already exists with name: " + specialtyDTO.getName());
        }
        Specialty specialty = Specialty.builder()
                .name(specialtyDTO.getName())
                .description(specialtyDTO.getDescription())
                .build();

        Specialty savedSpecialty = specialtyRepository.save(specialty);

        // Atualiza o ID do DTO para retornar
        specialtyDTO.setId(savedSpecialty.getId());
        return specialtyDTO;
    }

    // Método para converter
    private SpecialtyDTO convertToDTO(Specialty specialty) {
        SpecialtyDTO dto = new SpecialtyDTO();
        dto.setId(specialty.getId());
        dto.setName(specialty.getName());
        dto.setDescription(specialty.getDescription());
        return dto;
    }

    public void deleteSpecialty(Long id){
        // Primeiro verifica se existe
        if (!specialtyRepository.existsById(id)) {
            throw new RuntimeException("Specialty does not exist with id: " + id);
        }
        // Se existe, mandamos o banco apagar
        specialtyRepository.deleteById(id);
    }

    public SpecialtyDTO updateSpecialty(Long id, SpecialtyDTO specialtyDTO) {
        // Buscar no banco
        Specialty specialty = specialtyRepository.findById(id).orElseThrow(() -> new RuntimeException("Specialty does not exist with id: " + id));

        // Atualizar os dados
        specialty.setName(specialtyDTO.getName());
        specialty.setDescription(specialtyDTO.getDescription());

        // Salvar as alterações
        Specialty savedSpecialty = specialtyRepository.save(specialty);

        // Converter para DTO
        return convertToDTO(savedSpecialty);
    }


}
