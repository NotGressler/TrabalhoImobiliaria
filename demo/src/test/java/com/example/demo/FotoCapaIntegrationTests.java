package com.example.demo;

import static org.junit.jupiter.api.Assertions.*;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.transaction.annotation.Transactional;
import com.example.demo.repositories.ImovelRepository;
import com.example.demo.repositories.FotoImovelRepository;
import com.example.demo.models.ImovelModel;
import com.example.demo.models.FotoImovelModel;
import com.example.demo.services.FotoImovelService;

@SpringBootTest
class FotoCapaIntegrationTests {
    @Autowired ImovelRepository imoveis;
    @Autowired FotoImovelRepository fotos;
    @Autowired FotoImovelService service;

    @Test
    @Transactional
    void definirCapaNoBanco() {
        ImovelModel imovel = new ImovelModel();
        imovel.setTitulo("Teste de capa");
        imovel = imoveis.saveAndFlush(imovel);
        FotoImovelModel anterior = new FotoImovelModel();
        anterior.setImovel(imovel);
        anterior.setNomeArquivo("anterior.jpg");
        anterior.setCapa(true);
        fotos.saveAndFlush(anterior);
        FotoImovelModel nova = new FotoImovelModel();
        nova.setImovel(imovel);
        nova.setNomeArquivo("nova.jpg");
        nova.setCapa(false);
        fotos.saveAndFlush(nova);
        service.tornarCapa(nova.getId());
        fotos.flush();
        assertTrue(nova.getCapa());
        assertFalse(anterior.getCapa());
    }
}
