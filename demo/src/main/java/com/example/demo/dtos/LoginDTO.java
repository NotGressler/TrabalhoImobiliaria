package com.example.demo.dtos;

public record LoginDTO(String email, String senha) {
    @Override public String toString() { return "LoginDTO[credenciais protegidas]"; }
}
