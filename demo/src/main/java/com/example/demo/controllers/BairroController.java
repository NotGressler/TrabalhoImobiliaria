package com.example.demo.controllers;

import java.net.URI;
import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

import com.example.demo.models.BairroModel;
import com.example.demo.services.BairroService;

@RestController
@RequestMapping(value = "/bairros")
public class BairroController {

    @Autowired
    private BairroService service;

    @GetMapping()
    public ResponseEntity<List<BairroModel>> getAllBairros() {
        List<BairroModel> list = service.getAll();
        return ResponseEntity.status(HttpStatus.OK).body(list);
    }

    @GetMapping("/bairros-page")
    public Page<BairroModel> getPosts(Pageable pageable) {
        return service.getAll(pageable);
    }


    @GetMapping(value = "/{id}")
        public ResponseEntity<BairroModel> find(@PathVariable Integer id) {
        BairroModel model = service.find(id);
        return ResponseEntity.status(HttpStatus.OK).body(model);
    }

    @PostMapping
    public ResponseEntity<Void> insert(@RequestBody BairroModel model) {
        model = service.insert(model);
        // return new ResponseEntity(model, HttpStatus.CREATED);
        URI uri =
        ServletUriComponentsBuilder.fromCurrentRequest().path("/{id}").buildAndExpand(model.getId()).toUri();
        return ResponseEntity.created(uri).build();
        }

    @PutMapping(value = "/{id}")
    public ResponseEntity<Void> update(@RequestBody BairroModel model, @PathVariable Integer id) {
        model.setId(id);
        model = service.update(model);
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping(value = "/{id}")
    public ResponseEntity<Void> delete(@PathVariable Integer id) {
        service.delete(id);
        return ResponseEntity.noContent().build();
    }


}
