package com.example.demo.services;

import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.List;
import java.util.Locale;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.oauth2.jose.jws.MacAlgorithm;
import org.springframework.security.oauth2.jwt.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import com.example.demo.dtos.LoginDTO;
import com.example.demo.dtos.RegisterDTO;
import com.example.demo.dtos.SessionUserDTO;
import com.example.demo.dtos.TokenDTO;
import com.example.demo.models.UserModel;
import com.example.demo.repositories.UserRepository;

@Service
public class AuthService {
    @Autowired private UserRepository repository;
    @Autowired private PasswordEncoder passwordEncoder;
    @Autowired private JwtEncoder encoder;

    public TokenDTO login(LoginDTO dto) {
        if (dto.email() == null || dto.senha() == null || dto.email().isBlank() || dto.senha().isBlank()) {
            throw unauthorized();
        }
        var user = repository.findByEmailIgnoreCase(dto.email().trim()).orElseThrow(this::unauthorized);
        if (user.getSenha() == null || !passwordEncoder.matches(dto.senha(), user.getSenha())) {
            throw unauthorized();
        }
        return tokenFor(user);
    }

    @Transactional
    public TokenDTO register(RegisterDTO dto) {
        String nome = dto.nome() == null ? "" : dto.nome().trim();
        String email = dto.email() == null ? "" : dto.email().trim().toLowerCase(Locale.ROOT);
        String senha = dto.senha();
        if (nome.length() < 2 || nome.length() > 100) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Informe um nome entre 2 e 100 caracteres.");
        }
        if (email.length() > 254 || !email.matches("^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$")) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Informe um e-mail válido.");
        }
        if (senha == null || senha.isBlank() || senha.length() < 8 || senha.getBytes(StandardCharsets.UTF_8).length > 72) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "A senha deve ter pelo menos 8 caracteres e no máximo 72 bytes.");
        }
        if (repository.existsByEmailIgnoreCase(email)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Este e-mail já está cadastrado. Entre na sua conta.");
        }
        var user = new UserModel();
        user.setNome(nome);
        user.setEmail(email);
        user.setSenha(passwordEncoder.encode(senha));
        // O perfil é definido no servidor, nunca a partir do cadastro público.
        user.setTipo("USER");
        try {
            user = repository.saveAndFlush(user);
        } catch (DataIntegrityViolationException exception) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Este e-mail já está cadastrado. Entre na sua conta.");
        }
        return tokenFor(user);
    }

    public SessionUserDTO currentUser(Jwt jwt) {
        Integer id;
        try {
            id = Integer.valueOf(jwt.getSubject());
        } catch (NumberFormatException exception) {
            throw unauthorized();
        }
        var user = repository.findById(id).orElseThrow(this::unauthorized);
        if (user.getTipo() == null || !List.of("USER", "ADMIN").contains(user.getTipo()) || jwt.getExpiresAt() == null) {
            throw unauthorized();
        }
        return new SessionUserDTO(user.getId(), user.getNome(), user.getEmail(), user.getTipo(), jwt.getExpiresAt().toEpochMilli());
    }

    private TokenDTO tokenFor(UserModel user) {
        if (user.getTipo() == null || !List.of("ADMIN", "USER").contains(user.getTipo())) throw unauthorized();
        Instant now = Instant.now();
        JwtClaimsSet claims = JwtClaimsSet.builder().issuer("demo").subject(user.getId().toString())
            .issuedAt(now).expiresAt(now.plusSeconds(3600))
            .claim("roles", List.of(user.getTipo())).build();
        String token = encoder.encode(JwtEncoderParameters.from(
            JwsHeader.with(MacAlgorithm.HS256).build(), claims)).getTokenValue();
        return new TokenDTO(token, "Bearer", 3600);
    }

    private ResponseStatusException unauthorized() {
        return new ResponseStatusException(HttpStatus.UNAUTHORIZED, "E-mail ou senha inválidos, ou sessão expirada.");
    }
}
