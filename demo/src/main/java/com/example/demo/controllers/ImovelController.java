package com.example.demo.controllers;

import java.net.URI;
import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

import com.example.demo.models.ImovelModel;
import com.example.demo.dtos.SaberMaisDTO;
import com.example.demo.services.EmailService;
import com.example.demo.services.ImovelService;
import java.util.Map;
import jakarta.mail.internet.InternetAddress;
import jakarta.mail.internet.AddressException;

import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;


@RestController
@RequestMapping("/imoveis")
public class ImovelController {


    @Autowired
    private ImovelService service;

    @Autowired
    private EmailService emailService;

    @org.springframework.beans.factory.annotation.Value("${app.mail.contact:joaopatrao@jgimoveis.com.br}")
    private String contatoEmail;

    @PostMapping("/sabermais/{id}")
    public ResponseEntity<String> saberMais(@PathVariable Integer id, @RequestBody SaberMaisDTO cliente) {
        if (cliente.nome() == null || cliente.nome().isBlank()
                || cliente.telefone() == null || cliente.telefone().isBlank()
                || cliente.email() == null || cliente.email().isBlank()
                || cliente.mensagem() == null || cliente.mensagem().isBlank()) {
            return ResponseEntity.badRequest().body("Informe nome, telefone, email e mensagem.");
        }
        if (cliente.nome().length() > 100 || cliente.email().length() > 254
                || cliente.mensagem().length() > 2000 || cliente.telefone().length() > 20
                || !cliente.telefone().replaceAll("\\D", "").matches("\\d{10,11}")) {
            return ResponseEntity.badRequest().body("Confira os dados e informe um telefone com DDD.");
        }
        try {
            InternetAddress endereco = new InternetAddress(cliente.email(), true);
            endereco.validate();
            if (!cliente.email().equals(endereco.getAddress()) || cliente.email().contains("\r")
                    || cliente.email().contains("\n")) {
                return ResponseEntity.badRequest().body("Informe um email válido.");
            }
        } catch (AddressException e) {
            return ResponseEntity.badRequest().body("Informe um email válido.");
        }

        ImovelModel imovel = service.find(id);
        if (imovel == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Imóvel não encontrado.");
        }
        try {
            emailService.enviarEmailComTemplate(contatoEmail, "Contato sobre o imóvel #" + imovel.getId(),
                    "email/contato", Map.of("cliente", cliente, "imovel", imovel));
            return ResponseEntity.ok("Mensagem enviada para a equipe da imobiliária.");
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_GATEWAY)
                    .body("Não foi possível enviar o email. Tente novamente mais tarde.");
        }
    }

     @GetMapping()
    public ResponseEntity<List<ImovelModel>> getAll() {
        List<ImovelModel> list = service.getAll();
        return ResponseEntity.status(HttpStatus.OK).body(list);
    }

    @GetMapping(value = "/{id}")
        public ResponseEntity<ImovelModel> find(@PathVariable Integer id) {
        ImovelModel model = service.find(id);
        if(model!=null){
            return ResponseEntity.status(HttpStatus.OK).body(model);
        }
        else{
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        }
    }

    @PostMapping
    public ResponseEntity<Void> insert(@RequestBody ImovelModel model) {
        model = service.insert(model);
        // return new ResponseEntity(model, HttpStatus.CREATED);
        URI uri =
        ServletUriComponentsBuilder.fromCurrentRequest().path("/{id}").buildAndExpand(model.getId()).toUri();
        return ResponseEntity.created(uri).build();
        }

    @PutMapping(value = "/{id}")
    public ResponseEntity<Void> update(@RequestBody ImovelModel model, @PathVariable Integer id) {
        model.setId(id);
        return service.update(model) == null ? ResponseEntity.notFound().build() : ResponseEntity.noContent().build();
       
    }

    @DeleteMapping(value = "/{id}")
    public ResponseEntity<Void> delete(@PathVariable Integer id) {
        service.delete(id);
        return ResponseEntity.noContent().build();
    }

    @org.springframework.web.bind.annotation.PatchMapping("/{id}/status")
    public ResponseEntity<Void> updateStatus(@PathVariable Integer id,
            @RequestBody com.example.demo.dtos.StatusImovelDTO dto) {
        if (dto.status() == null || dto.status().isBlank()) {
            return ResponseEntity.badRequest().build();
        }
        if (service.updateStatus(id, dto.status()) == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.noContent().build();
    }

   
}
