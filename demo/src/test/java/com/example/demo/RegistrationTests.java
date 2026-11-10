package com.example.demo;

import com.example.demo.config.SecurityConfig;
import com.example.demo.dtos.LoginDTO;
import com.example.demo.dtos.RegisterDTO;
import com.example.demo.models.UserModel;
import com.example.demo.repositories.UserRepository;
import com.example.demo.services.AuthService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.server.ResponseStatusException;
import java.util.List;
import java.util.Optional;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class RegistrationTests {
    private UserRepository repository;
    private AuthService service;
    private BCryptPasswordEncoder passwords;
    private JwtDecoder decoder;

    @BeforeEach
    void setup() {
        repository = mock(UserRepository.class);
        passwords = new BCryptPasswordEncoder();
        var security = new SecurityConfig();
        var key = security.jwtKey("segredo-exclusivo-dos-testes-com-32-bytes");
        decoder = security.jwtDecoder(key);
        service = new AuthService();
        ReflectionTestUtils.setField(service, "repository", repository);
        ReflectionTestUtils.setField(service, "passwordEncoder", passwords);
        ReflectionTestUtils.setField(service, "encoder", security.jwtEncoder(key));
        when(repository.saveAndFlush(any())).thenAnswer(invocation -> {
            UserModel user = invocation.getArgument(0); user.setId(42); return user;
        });
    }

    @Test
    void cadastroNormalizaEmailCriptografaSenhaERetornaJwtCliente() {
        var result = service.register(new RegisterDTO("  Maria Silva  ", "  MARIA@example.com ", "senha-segura123"));
        var captor = ArgumentCaptor.forClass(UserModel.class);
        verify(repository).saveAndFlush(captor.capture());
        var saved = captor.getValue();
        assertEquals("Maria Silva", saved.getNome());
        assertEquals("maria@example.com", saved.getEmail());
        assertEquals("USER", saved.getTipo());
        assertNotEquals("senha-segura123", saved.getSenha());
        assertTrue(passwords.matches("senha-segura123", saved.getSenha()));
        var jwt = decoder.decode(result.token());
        assertEquals("42", jwt.getSubject());
        assertEquals(List.of("USER"), jwt.getClaimAsStringList("roles"));
        assertEquals(3600, result.expiresIn());
        when(repository.findById(42)).thenReturn(Optional.of(saved));
        var current = service.currentUser(jwt);
        assertEquals("Maria Silva", current.nome());
        assertEquals("USER", current.tipo());
        assertTrue(current.expiresAt() > System.currentTimeMillis());
    }

    @Test
    void emailDuplicadoRetorna409SemCadastrar() {
        when(repository.existsByEmailIgnoreCase("maria@example.com")).thenReturn(true);
        assertEquals(409, assertThrows(ResponseStatusException.class,
            () -> service.register(new RegisterDTO("Maria", "MARIA@example.com", "senha-segura123"))).getStatusCode().value());
        verify(repository, never()).saveAndFlush(any());
    }

    @Test
    void conflitoSimultaneoNoBancoTambemRetorna409() {
        doThrow(new DataIntegrityViolationException("duplicate")).when(repository).saveAndFlush(any());
        assertEquals(409, assertThrows(ResponseStatusException.class,
            () -> service.register(new RegisterDTO("Maria", "maria@example.com", "senha-segura123"))).getStatusCode().value());
    }

    @Test
    void dadosInvalidosNaoSaoPersistidos() {
        for (var dto : List.of(new RegisterDTO(" ", "a@example.com", "senha12345"),
                new RegisterDTO("Maria", "email-invalido", "senha12345"),
                new RegisterDTO("Maria", "a@example.com", "curta"),
                new RegisterDTO("Maria", "a@example.com", "á".repeat(37)))) {
            assertEquals(400, assertThrows(ResponseStatusException.class, () -> service.register(dto)).getStatusCode().value());
        }
        verify(repository, never()).saveAndFlush(any());
    }

    @Test
    void loginAceitaEmailComMaiusculasEEspacos() {
        var user = new UserModel(42, "Maria", "maria@example.com", passwords.encode("senha12345"), "USER");
        when(repository.findByEmailIgnoreCase("MARIA@example.com")).thenReturn(Optional.of(user));
        assertEquals("42", decoder.decode(service.login(new LoginDTO(" MARIA@example.com ", "senha12345")).token()).getSubject());
    }

    @Test
    void usuarioRemovidoNaoMantemAcessoASessao() {
        var result = service.register(new RegisterDTO("Maria", "maria@example.com", "senha12345"));
        assertEquals(401, assertThrows(ResponseStatusException.class,
            () -> service.currentUser(decoder.decode(result.token()))).getStatusCode().value());
    }
}
