package com.example.demo.services;

import java.util.List;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import com.example.demo.models.FavoritoModel;
import com.example.demo.repositories.FavoritoRepository;
import com.example.demo.repositories.ImovelRepository;
import com.example.demo.repositories.UserRepository;

@Service
public class FavoritoService {
    private final FavoritoRepository favoritos;
    private final ImovelRepository imoveis;
    private final UserRepository usuarios;

    public FavoritoService(FavoritoRepository favoritos, ImovelRepository imoveis, UserRepository usuarios) {
        this.favoritos = favoritos;
        this.imoveis = imoveis;
        this.usuarios = usuarios;
    }

    @Transactional(readOnly = true)
    public List<Integer> listar(Integer usuarioId) {
        return favoritos.findByUsuarioIdOrderByIdDesc(usuarioId).stream().map(f -> f.getImovel().getId()).toList();
    }

    public void adicionar(Integer usuarioId, Integer imovelId) {
        var usuario = usuarios.findById(usuarioId).orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Sua sessão expirou. Entre novamente."));
        var imovel = imoveis.findById(imovelId).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Imóvel não encontrado."));
        if (favoritos.existsByUsuarioIdAndImovelId(usuarioId, imovelId)) return;
        var favorito = new FavoritoModel();
        favorito.setUsuario(usuario);
        favorito.setImovel(imovel);
        try {
            // A transação do repositório termina aqui. Uma repetição concorrente é idempotente.
            favoritos.saveAndFlush(favorito);
        } catch (DataIntegrityViolationException exception) {
            if (!favoritos.existsByUsuarioIdAndImovelId(usuarioId, imovelId)) {
                throw new ResponseStatusException(HttpStatus.CONFLICT, "Não foi possível salvar este imóvel. Atualize a página e tente novamente.");
            }
        }
    }

    @Transactional
    public void remover(Integer usuarioId, Integer imovelId) {
        favoritos.deleteByUsuarioIdAndImovelId(usuarioId, imovelId);
    }
}
