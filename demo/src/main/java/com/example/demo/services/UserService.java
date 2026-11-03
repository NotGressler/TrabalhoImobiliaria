package com.example.demo.services;

import java.util.List;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.example.demo.dtos.UserDTO;
import com.example.demo.models.UserModel;
import com.example.demo.repositories.UserRepository;

@Service 
public class UserService {
    @Autowired 
    private UserRepository repository;

    @Autowired
    private org.springframework.security.crypto.password.PasswordEncoder passwordEncoder;

    public List<UserModel> getAllUsers() {
        List<UserModel> lista = repository.findAll();
        return lista;
    }

    public UserModel find (Integer id) {
        Optional<UserModel> user = repository.findById(id);
        return user.orElse(null);
    }

        public UserModel insert(UserDTO dto) {
        UserModel model = new UserModel();
        model.setNome(dto.getNome());
        model.setEmail(dto.getEmail());
        model.setSenha(passwordEncoder.encode(dto.getSenha()));
        model.setTipo(dto.getTipo());
        return repository.save(model);
    }

    public UserModel update(UserDTO dto) {
        UserModel model = find(dto.getId());
        try {
            if (model != null) {
                model.setNome(dto.getNome());
                model.setEmail(dto.getEmail());
                if (dto.getSenha() != null && !dto.getSenha().isBlank()) {
                    model.setSenha(passwordEncoder.encode(dto.getSenha()));
                }
                model.setTipo(dto.getTipo());
                return repository.save(model);
            }
            return null;
        } catch (Exception e) {
            return null;
        }
    }

    public void delete(Integer id) {
        repository.deleteById(id);
    }

    
}
