package com.barberapp.backend.controller;

import com.barberapp.backend.dto.SpecialtyDTO;
import com.barberapp.backend.service.SpecialtyService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/specialties")
@RequiredArgsConstructor
public class SpecialtyController {

    private final SpecialtyService specialtyService;

    // GET: Listar todas
    @GetMapping
    public ResponseEntity<List<SpecialtyDTO>> getAll() {
        return ResponseEntity.ok(specialtyService.getAllSpecialties());
    }

    // POST : Criar nova
    @PostMapping
    public ResponseEntity<SpecialtyDTO> create(@RequestBody SpecialtyDTO dto) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(specialtyService.createSpecialty(dto));
    }

    // DELETE : Remover especialidade
    @DeleteMapping("/{id}")
    public ResponseEntity<SpecialtyDTO> delete(@PathVariable Long id) {
        specialtyService.deleteSpecialty(id);

        // Retorna 204 No content
        return ResponseEntity.noContent().build();
    }

    // PUT: Atualizar existente
    @PutMapping("/{id}")
    public ResponseEntity<SpecialtyDTO> update(@PathVariable Long id, @RequestBody SpecialtyDTO dto) {
        return ResponseEntity.ok(specialtyService.updateSpecialty(id, dto));
    }

}
