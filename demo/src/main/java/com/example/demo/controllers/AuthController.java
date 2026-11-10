package com.example.demo.controllers;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;
import com.example.demo.dtos.LoginDTO;
import com.example.demo.dtos.RegisterDTO;
import com.example.demo.dtos.SessionUserDTO;
import com.example.demo.dtos.TokenDTO;
import com.example.demo.services.AuthService;

@RestController
public class AuthController {
    @Autowired private AuthService service;

    @PostMapping("/public/login")
    public ResponseEntity<TokenDTO> login(@RequestBody LoginDTO dto) {
        return ResponseEntity.ok(service.login(dto));
    }

    @PostMapping("/auth/register")
    public ResponseEntity<TokenDTO> register(@RequestBody RegisterDTO dto) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.register(dto));
    }

    @GetMapping("/auth/me")
    public ResponseEntity<SessionUserDTO> me(@AuthenticationPrincipal Jwt jwt) {
        return ResponseEntity.ok().cacheControl(org.springframework.http.CacheControl.noStore()).body(service.currentUser(jwt));
    }
}
