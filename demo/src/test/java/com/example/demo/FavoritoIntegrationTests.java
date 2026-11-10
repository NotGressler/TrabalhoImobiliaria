package com.example.demo;

import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import com.example.demo.models.ImovelModel;
import com.example.demo.models.UserModel;
import com.example.demo.repositories.ImovelRepository;
import com.example.demo.repositories.UserRepository;
import com.example.demo.services.FavoritoService;
import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@Transactional
class FavoritoIntegrationTests {
    @Autowired FavoritoService favoritos;
    @Autowired UserRepository usuarios;
    @Autowired ImovelRepository imoveis;
    @Autowired com.example.demo.services.ImovelService imovelService;
    @Autowired com.example.demo.services.UserService userService;

    private UserModel cliente() {
        return usuarios.saveAndFlush(new UserModel(null, "Teste favorito", "qa-" + UUID.randomUUID() + "@example.test", "senha-de-teste", "USER"));
    }

    private ImovelModel imovel() {
        var imovel = new ImovelModel();
        imovel.setTitulo("Imóvel de teste favorito");
        imovel.setStatus("disponivel");
        return imoveis.saveAndFlush(imovel);
    }

    @Test
    void favoritosSaoPersistidosIsoladosERemovidosPorCliente() {
        var primeiro = cliente();
        var segundo = cliente();
        var imovel = imovel();
        favoritos.adicionar(primeiro.getId(), imovel.getId());
        favoritos.adicionar(primeiro.getId(), imovel.getId());
        assertEquals(java.util.List.of(imovel.getId()), favoritos.listar(primeiro.getId()));
        assertTrue(favoritos.listar(segundo.getId()).isEmpty());
        favoritos.remover(segundo.getId(), imovel.getId());
        assertEquals(1, favoritos.listar(primeiro.getId()).size());
        favoritos.remover(primeiro.getId(), imovel.getId());
        favoritos.remover(primeiro.getId(), imovel.getId());
        assertTrue(favoritos.listar(primeiro.getId()).isEmpty());
    }

    @Test
    void imovelInexistenteNaoPodeSerFavoritado() {
        var cliente = cliente();
        assertEquals(404, assertThrows(ResponseStatusException.class, () -> favoritos.adicionar(cliente.getId(), Integer.MAX_VALUE)).getStatusCode().value());
        assertTrue(favoritos.listar(cliente.getId()).isEmpty());
    }

    @Test
    void excluirImovelRemoveFavoritosRelacionados() {
        var cliente = cliente();
        var imovel = imovel();
        favoritos.adicionar(cliente.getId(), imovel.getId());
        imovelService.delete(imovel.getId());
        imoveis.flush();
        assertTrue(favoritos.listar(cliente.getId()).isEmpty());
    }

    @Test
    void excluirUsuarioRemoveFavoritosSemImpedirExclusao() {
        var cliente = cliente();
        var imovel = imovel();
        favoritos.adicionar(cliente.getId(), imovel.getId());
        userService.delete(cliente.getId());
        usuarios.flush();
        assertTrue(favoritos.listar(cliente.getId()).isEmpty());
    }
}
