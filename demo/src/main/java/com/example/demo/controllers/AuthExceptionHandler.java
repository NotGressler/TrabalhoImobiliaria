package com.example.demo.controllers;

import java.util.Map;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.server.ResponseStatusException;

@RestControllerAdvice(assignableTypes = {AuthController.class, FavoritoController.class, ImovelController.class, FotoImovelController.class, BairroController.class, TipoImovelController.class})
public class AuthExceptionHandler {
    @ExceptionHandler(ResponseStatusException.class)
    public ResponseEntity<Map<String, Object>> handle(ResponseStatusException exception) {
        return ResponseEntity.status(exception.getStatusCode()).body(Map.of(
            "status", exception.getStatusCode().value(), "message", exception.getReason() == null ? "Não foi possível concluir a solicitação." : exception.getReason()));
    }

    @ExceptionHandler(HttpMessageNotReadableException.class)
    public ResponseEntity<Map<String, Object>> malformedRequest() {
        return ResponseEntity.badRequest().body(Map.of("status", 400, "message", "Confira os dados informados."));
    }

    @ExceptionHandler(org.springframework.dao.DataIntegrityViolationException.class)
    public ResponseEntity<Map<String, Object>> linkedRecords() {
        return ResponseEntity.status(409).body(Map.of("status", 409, "message", "Não foi possível concluir: existem dados vinculados ou informações já cadastradas. Confira o cadastro antes de tentar novamente."));
    }

    @ExceptionHandler(org.springframework.web.multipart.MaxUploadSizeExceededException.class)
    public ResponseEntity<Map<String, Object>> uploadTooLarge() {
        return ResponseEntity.status(413).body(Map.of("status", 413, "message", "A foto excede o limite de 10 MB."));
    }
}
