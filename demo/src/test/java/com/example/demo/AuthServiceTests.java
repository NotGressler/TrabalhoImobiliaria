package com.example.demo;

import com.example.demo.dtos.LoginDTO;
import com.example.demo.models.UserModel;
import com.example.demo.repositories.UserRepository;
import com.example.demo.services.AuthService;
import org.junit.jupiter.api.Test;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.server.ResponseStatusException;
import java.util.Optional;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class AuthServiceTests {
    @Test
    void senhaIncorretaOuEmailDesconhecidoRetornam401() {
        var repository = mock(UserRepository.class);
        var encoder = new BCryptPasswordEncoder();
        var service = new AuthService();
        ReflectionTestUtils.setField(service, "repository", repository);
        ReflectionTestUtils.setField(service, "passwordEncoder", encoder);
        var user = new UserModel();
        user.setSenha(encoder.encode("correta"));
        when(repository.findByEmail("user@exemplo.com")).thenReturn(Optional.of(user));
        when(repository.findByEmail("naoexiste@exemplo.com")).thenReturn(Optional.empty());
        assertEquals(401, assertThrows(ResponseStatusException.class,
            () -> service.login(new LoginDTO("user@exemplo.com", "errada"))).getStatusCode().value());
        assertEquals(401, assertThrows(ResponseStatusException.class,
            () -> service.login(new LoginDTO("naoexiste@exemplo.com", "qualquer"))).getStatusCode().value());
    }
}
