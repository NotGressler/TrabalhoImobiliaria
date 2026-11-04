package com.example.demo;

import com.example.demo.config.SecurityConfig;
import org.junit.jupiter.api.Test;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Import;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.oauth2.jwt.*;
import org.springframework.security.oauth2.jose.jws.MacAlgorithm;
import org.springframework.web.context.support.AnnotationConfigWebApplicationContext;
import org.springframework.mock.web.MockServletContext;
import org.springframework.web.servlet.config.annotation.EnableWebMvc;
import org.springframework.web.bind.annotation.*;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import jakarta.servlet.Filter;
import java.time.Instant;
import java.util.List;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

class SecurityTests {
    @Configuration
    @EnableWebMvc
    @EnableWebSecurity
    @Import({SecurityConfig.class, Routes.class})
    static class Config {}

    @RestController
    static class Routes {
        @GetMapping("/") String home() { return "site"; }
        @GetMapping("/_next/static/test.js") String asset() { return "script"; }
        @GetMapping("/images/logo-jg.png") String logo() { return "image"; }
        @GetMapping("/imoveis") String list() { return "[]"; }
        @PostMapping("/imoveis") void insert() {}
        @GetMapping("/fotos/vitrine") String photos() { return "[]"; }
        @PostMapping("/fotos") void insertPhoto() {}
        @PostMapping("/users") void user() {}
        @PatchMapping("/imoveis/{id}/status") void status() {}
    }

    @Test
    void aplicaPermissoesComTokensAssinados() throws Exception {
        try (var context = new AnnotationConfigWebApplicationContext()) {
            context.setServletContext(new MockServletContext());
            context.getEnvironment().getPropertySources().addFirst(
                new org.springframework.core.env.MapPropertySource("test", java.util.Map.of(
                    "security.jwt.secret", "segredo-de-testes-com-pelo-menos-32-bytes")));
            context.register(Config.class);
            context.refresh();
            var mvc = MockMvcBuilders.webAppContextSetup(context)
                .addFilters(context.getBean("springSecurityFilterChain", Filter.class)).build();
            var encoder = context.getBean(JwtEncoder.class);
            mvc.perform(get("/")).andExpect(status().isOk());
            mvc.perform(get("/_next/static/test.js")).andExpect(status().isOk());
            mvc.perform(get("/images/logo-jg.png")).andExpect(status().isOk());
            String user = token(encoder, "USER", Instant.now().plusSeconds(3600));
            String admin = token(encoder, "ADMIN", Instant.now().plusSeconds(3600));
            mvc.perform(get("/imoveis")).andExpect(status().isOk());
            mvc.perform(get("/fotos/vitrine")).andExpect(status().isOk());
            mvc.perform(post("/imoveis")).andExpect(status().isUnauthorized());
            mvc.perform(post("/fotos")).andExpect(status().isUnauthorized());
            mvc.perform(post("/users")).andExpect(status().isUnauthorized());
            mvc.perform(post("/imoveis").header("Authorization", "Bearer " + user)).andExpect(status().isForbidden());
            mvc.perform(post("/fotos").header("Authorization", "Bearer " + user)).andExpect(status().isForbidden());
            mvc.perform(post("/users").header("Authorization", "Bearer " + user)).andExpect(status().isForbidden());
            mvc.perform(post("/imoveis").header("Authorization", "Bearer " + admin)).andExpect(status().isOk());
            mvc.perform(post("/fotos").header("Authorization", "Bearer " + admin)).andExpect(status().isOk());
            mvc.perform(post("/users").header("Authorization", "Bearer " + admin)).andExpect(status().isOk());
            mvc.perform(patch("/imoveis/1/status")).andExpect(status().isUnauthorized());
            mvc.perform(patch("/imoveis/1/status").header("Authorization", "Bearer " + user)).andExpect(status().isOk());
            mvc.perform(post("/imoveis").header("Authorization", "Bearer invalido")).andExpect(status().isUnauthorized());
            mvc.perform(post("/imoveis").header("Authorization", "Bearer " + token(encoder, "ADMIN", Instant.now().minusSeconds(120))))
                .andExpect(status().isUnauthorized());
        }
    }

    private String token(JwtEncoder encoder, String role, Instant expiration) {
        return encoder.encode(JwtEncoderParameters.from(JwsHeader.with(MacAlgorithm.HS256).build(),
            JwtClaimsSet.builder().issuer("demo").subject("1").expiresAt(expiration)
                .claim("roles", List.of(role)).build())).getTokenValue();
    }
}
