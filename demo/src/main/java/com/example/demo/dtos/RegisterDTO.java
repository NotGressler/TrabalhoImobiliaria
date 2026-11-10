package com.example.demo.dtos;

public record RegisterDTO(String nome, String email, String senha) {
    @Override public String toString() { return "RegisterDTO[credenciais protegidas]"; }
}
