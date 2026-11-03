package com.example.demo.controllers;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import com.example.demo.dtos.LoginDTO;
import com.example.demo.dtos.TokenDTO;
import com.example.demo.services.AuthService;

@RestController
@RequestMapping("/auth")
public class AuthController {
    @Autowired private AuthService service;

    @PostMapping("/login")
    public ResponseEntity<TokenDTO> login(@RequestBody LoginDTO dto) {
        return ResponseEntity.ok(service.login(dto));
    }
}
