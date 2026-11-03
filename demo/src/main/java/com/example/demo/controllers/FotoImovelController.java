package com.example.demo.controllers;

import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.multipart.MultipartFile;

import com.example.demo.models.FotoImovelModel;
import com.example.demo.services.FotoImovelService;
import java.util.List;

@RestController
@RequestMapping("/fotos")
public class FotoImovelController {
    private final FotoImovelService service;

    public FotoImovelController(FotoImovelService service) {
        this.service = service;
    }

    @GetMapping(value = "/vitrine", produces = MediaType.APPLICATION_JSON_VALUE)
    public List<FotoVitrineDTO> listarParaVitrine() {
        return service.listarFotos().stream()
                .map(foto -> new FotoVitrineDTO(
                        foto.getImovel().getId(),
                        foto.getNomeArquivo(),
                        foto.getCapa(),
                        foto.getOrdem()))
                .toList();
    }

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE, produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<FotoImovelModel> salvar(
            @RequestParam("arquivo") MultipartFile arquivo,
            @RequestParam("imovelId") Integer imovelId) {
        return ResponseEntity.ok(service.salvarFoto(arquivo, imovelId));
    }

    @PutMapping(value = "/{id}", consumes = MediaType.MULTIPART_FORM_DATA_VALUE,
            produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<FotoImovelModel> editar(@PathVariable Integer id,
            @RequestParam("arquivo") MultipartFile arquivo) {
        return ResponseEntity.ok(service.editarFoto(id, arquivo));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> excluir(@PathVariable Integer id) {
        service.excluirFoto(id);
        return ResponseEntity.noContent().build();
    }

    @PatchMapping(value = "/{id}/capa", produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<FotoImovelModel> tornarCapa(@PathVariable Integer id) {
        return ResponseEntity.ok(service.tornarCapa(id));
    }

    public record FotoVitrineDTO(Integer imovelId, String nomeArquivo, Boolean capa, Integer ordem) {}
}
