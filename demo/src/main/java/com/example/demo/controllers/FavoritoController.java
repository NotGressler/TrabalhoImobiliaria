package com.example.demo.controllers;

import java.util.List;
import org.springframework.http.CacheControl;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import com.example.demo.services.AuthService;
import com.example.demo.services.FavoritoService;

@RestController
@RequestMapping("/favoritos")
public class FavoritoController {
    private final FavoritoService favoritos;
    private final AuthService auth;

    public FavoritoController(FavoritoService favoritos, AuthService auth) {
        this.favoritos = favoritos;
        this.auth = auth;
    }

    @GetMapping
    public ResponseEntity<List<Integer>> listar(@AuthenticationPrincipal Jwt jwt) {
        return ResponseEntity.ok().cacheControl(CacheControl.noStore()).body(favoritos.listar(cliente(jwt)));
    }

    @PutMapping("/{imovelId}")
    public ResponseEntity<Void> adicionar(@AuthenticationPrincipal Jwt jwt, @PathVariable Integer imovelId) {
        favoritos.adicionar(cliente(jwt), imovelId);
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/{imovelId}")
    public ResponseEntity<Void> remover(@AuthenticationPrincipal Jwt jwt, @PathVariable Integer imovelId) {
        favoritos.remover(cliente(jwt), imovelId);
        return ResponseEntity.noContent().build();
    }

    private Integer cliente(Jwt jwt) {
        var usuario = auth.currentUser(jwt);
        if (!"USER".equals(usuario.tipo())) throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Acesso exclusivo para clientes.");
        return usuario.id();
    }
}
