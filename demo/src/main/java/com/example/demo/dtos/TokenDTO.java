package com.example.demo.dtos;

public record TokenDTO(String token, String tipo, String tokenType, long expiresIn) {
    @Override public String toString() { return "TokenDTO[token protegido]"; }
}
