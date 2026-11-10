package com.example.demo.repositories;

import org.springframework.data.jpa.repository.JpaRepository;

import com.example.demo.models.UserModel;

public interface UserRepository extends JpaRepository<UserModel, Integer> {
    java.util.Optional<UserModel> findByEmail(String email);
    java.util.Optional<UserModel> findByEmailIgnoreCase(String email);
    boolean existsByEmailIgnoreCase(String email);

}
