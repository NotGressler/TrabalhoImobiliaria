package com.example.demo.config;

import com.example.demo.models.UserModel;
import com.example.demo.repositories.UserRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;

@Configuration
public class InitialAdminConfig {
    @Bean
    public CommandLineRunner initialAdmin(UserRepository repository, PasswordEncoder encoder,
            @Value("${BOOTSTRAP_ADMIN_EMAIL:}") String email,
            @Value("${BOOTSTRAP_ADMIN_PASSWORD:}") String password) {
        return args -> {
            // Criacao inicial opcional; nunca sobrescreve usuarios existentes.
            if (repository.count() == 0 && !email.isBlank() && !password.isBlank()) {
                UserModel admin = new UserModel();
                admin.setNome("Administrador");
                admin.setEmail(email);
                admin.setSenha(encoder.encode(password));
                admin.setTipo("ADMIN");
                repository.save(admin);
            }
        };
    }
}
