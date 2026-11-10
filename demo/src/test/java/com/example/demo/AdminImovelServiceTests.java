package com.example.demo;

import java.math.BigDecimal;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.web.server.ResponseStatusException;
import com.example.demo.models.*;
import com.example.demo.repositories.*;
import com.example.demo.services.*;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class AdminImovelServiceTests {
    private ImovelRepository repository;
    private ImovelService service;

    @BeforeEach
    void setup() {
        repository = mock(ImovelRepository.class);
        var bairros = mock(BairroRepository.class);
        var tipos = mock(TipoImovelRepository.class);
        var bairro = new BairroModel(); bairro.setId(1); bairro.setNome("Centro");
        var tipo = new TipoImovelModel(); tipo.setId(1); tipo.setNome("Casa");
        when(bairros.findById(1)).thenReturn(Optional.of(bairro));
        when(tipos.findById(1)).thenReturn(Optional.of(tipo));
        when(repository.saveAndFlush(any())).thenAnswer(call -> call.getArgument(0));
        service = new ImovelService(repository, mock(FavoritoRepository.class), bairros, tipos, mock(FotoImovelRepository.class), mock(FotoImovelService.class));
    }

    private ImovelModel anuncio() {
        var model = new ImovelModel();
        model.setTitulo("Casa no Centro"); model.setDescricao("Casa ampla para a família.");
        model.setEndereco("Rua Principal"); model.setNumero("123"); model.setAreaTotal(new BigDecimal("150.00"));
        model.setFinalidade("Venda"); model.setPrecoVenda(new BigDecimal("450000.00")); model.setStatus("Disponível");
        var bairro = new BairroModel(); bairro.setId(1); model.setBairro(bairro);
        var tipo = new TipoImovelModel(); tipo.setId(1); model.setTipoImovel(tipo);
        return model;
    }

    @Test
    void cadastroNaoSobrescreveIdEPadronizaFinalidadeESituacao() {
        var model = anuncio(); model.setId(99); model.setFinalidade("Venda e aluguel"); model.setPrecoAluguel(new BigDecimal("2500.00"));
        var saved = service.insert(model);
        assertNull(saved.getId());
        assertEquals("disponivel", saved.getStatus());
        assertEquals("venda e aluguel", saved.getFinalidade());
        assertEquals("Centro", saved.getBairro().getNome());
    }

    @Test
    void anuncioComVendaEAluguelExigeAmbosOsValores() {
        var model = anuncio(); model.setFinalidade("venda e aluguel");
        assertEquals(400, assertThrows(ResponseStatusException.class, () -> service.insert(model)).getStatusCode().value());
        verify(repository, never()).saveAndFlush(any());
    }

    @Test
    void areaConstruidaInvalidaOuBairroInexistenteNaoSaoSalvos() {
        var model = anuncio(); model.setAreaConstruida(new BigDecimal("200.00"));
        assertEquals(400, assertThrows(ResponseStatusException.class, () -> service.insert(model)).getStatusCode().value());
        var outro = anuncio(); outro.getBairro().setId(999);
        assertEquals(400, assertThrows(ResponseStatusException.class, () -> service.insert(outro)).getStatusCode().value());
        verify(repository, never()).saveAndFlush(any());
    }

    @Test
    void atualizarImovelInexistenteNaoCriaNovoRegistro() {
        var model = anuncio(); model.setId(999);
        assertNull(service.update(model));
        verify(repository, never()).saveAndFlush(any());
    }
}
