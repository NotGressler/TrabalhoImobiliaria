package com.example.demo.services;

import java.time.Instant;
import java.util.List;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.oauth2.jose.jws.MacAlgorithm;
import org.springframework.security.oauth2.jwt.*;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;
import com.example.demo.dtos.LoginDTO;
import com.example.demo.dtos.TokenDTO;
import com.example.demo.repositories.UserRepository;

@Service
public class AuthService {
    @Autowired private UserRepository repository;
    @Autowired private PasswordEncoder passwordEncoder;
    @Autowired private JwtEncoder encoder;

    public TokenDTO login(LoginDTO dto) {
        if (dto.email() == null || dto.senha() == null || dto.email().isBlank() || dto.senha().isBlank()) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Email ou senha invalidos.");
        }
        var user = repository.findByEmail(dto.email()).orElseThrow(
            () -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Email ou senha invalidos."));
        if (user.getSenha() == null || !passwordEncoder.matches(dto.senha(), user.getSenha())) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Email ou senha invalidos.");
        }
        if (!"ADMIN".equals(user.getTipo()) && !"USER".equals(user.getTipo())) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Perfil invalido.");
        }
        Instant now = Instant.now();
        JwtClaimsSet claims = JwtClaimsSet.builder().issuer("demo").subject(user.getId().toString())
            .issuedAt(now).expiresAt(now.plusSeconds(3600))
            .claim("roles", List.of(user.getTipo())).build();
        String token = encoder.encode(JwtEncoderParameters.from(
            JwsHeader.with(MacAlgorithm.HS256).build(), claims)).getTokenValue();
        return new TokenDTO(token, "Bearer", 3600);
    }
}
