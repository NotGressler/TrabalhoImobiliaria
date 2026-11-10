package com.example.demo.services;

import java.math.BigDecimal;
import java.text.Normalizer;
import java.util.List;
import java.util.Locale;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import com.example.demo.models.ImovelModel;
import com.example.demo.repositories.*;

@Service
public class ImovelService {
    private final ImovelRepository repository;
    private final FavoritoRepository favoritos;
    private final BairroRepository bairros;
    private final TipoImovelRepository tipos;
    private final FotoImovelRepository fotos;
    private final FotoImovelService fotoService;

    public ImovelService(ImovelRepository repository, FavoritoRepository favoritos, BairroRepository bairros,
            TipoImovelRepository tipos, FotoImovelRepository fotos, FotoImovelService fotoService) {
        this.repository = repository;
        this.favoritos = favoritos;
        this.bairros = bairros;
        this.tipos = tipos;
        this.fotos = fotos;
        this.fotoService = fotoService;
    }

    public List<ImovelModel> getAll() { return repository.findAll(); }
    public ImovelModel find(Integer id) { return repository.findById(id).orElse(null); }

    @Transactional
    public ImovelModel insert(ImovelModel model) {
        validar(model);
        model.setId(null);
        return repository.saveAndFlush(model);
    }

    @Transactional
    public ImovelModel update(ImovelModel model) {
        if (model.getId() == null || !repository.existsById(model.getId())) return null;
        validar(model);
        return repository.saveAndFlush(model);
    }

    @Transactional
    public ImovelModel updateStatus(Integer id, String status) {
        ImovelModel model = find(id);
        if (model == null) return null;
        model.setStatus(statusValido(status));
        return repository.save(model);
    }

    @Transactional
    public void delete(Integer id) {
        if (!repository.existsById(id)) throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Imóvel não encontrado.");
        favoritos.deleteByImovelId(id);
        for (var foto : fotos.findByImovelId(id)) fotoService.excluirFoto(foto.getId());
        repository.deleteById(id);
        // As imagens físicas só são removidas pelo FotoImovelService após o commit.
        repository.flush();
    }

    private void validar(ImovelModel model) {
        model.setTitulo(texto(model.getTitulo(), "Informe o título do imóvel.", 150));
        model.setDescricao(texto(model.getDescricao(), "Informe a descrição do imóvel.", 10000));
        model.setEndereco(texto(model.getEndereco(), "Informe o endereço do imóvel.", 255));
        model.setNumero(texto(model.getNumero(), "Informe o número do imóvel (ou S/N).", 30));
        model.setStatus(statusValido(model.getStatus()));
        String finalidade = normalizar(model.getFinalidade());
        if (finalidade.equals("ambos") || (finalidade.contains("venda") && (finalidade.contains("aluguel") || finalidade.contains("locacao")))) finalidade = "venda e aluguel";
        if (finalidade.equals("locacao")) finalidade = "aluguel";
        if (!List.of("venda", "aluguel", "venda e aluguel").contains(finalidade)) invalido("Selecione a finalidade do imóvel.");
        model.setFinalidade(finalidade);
        if (finalidade.contains("venda")) valor(model.getPrecoVenda(), "Informe um valor de venda válido.");
        else model.setPrecoVenda(null);
        if (finalidade.contains("aluguel")) valor(model.getPrecoAluguel(), "Informe um valor de aluguel válido.");
        else model.setPrecoAluguel(null);
        if (model.getAreaTotal() == null || model.getAreaTotal().signum() <= 0 || model.getAreaTotal().compareTo(new BigDecimal("9999999999999.99")) > 0 || model.getAreaTotal().scale() > 2) invalido("Informe uma área total maior que zero, com até duas casas decimais.");
        if (model.getAreaConstruida() != null && (model.getAreaConstruida().signum() < 0 || model.getAreaConstruida().compareTo(model.getAreaTotal()) > 0 || model.getAreaConstruida().scale() > 2)) invalido("A área construída deve estar entre zero e a área total, com até duas casas decimais.");
        model.setDormitorios(quantidade(model.getDormitorios()));
        model.setBanheiros(quantidade(model.getBanheiros()));
        model.setGaragem(quantidade(model.getGaragem()));
        if (model.getBairro() == null || model.getBairro().getId() == null) invalido("Selecione um bairro.");
        model.setBairro(bairros.findById(model.getBairro().getId()).orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Bairro não encontrado. Atualize as opções.")));
        if (model.getTipoImovel() == null || model.getTipoImovel().getId() == null) invalido("Selecione um tipo de imóvel.");
        model.setTipoImovel(tipos.findById(model.getTipoImovel().getId()).orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Tipo de imóvel não encontrado. Atualize as opções.")));
        if (model.getComplemento() != null && model.getComplemento().length() > 255) invalido("O complemento deve ter até 255 caracteres.");
        if (model.getCaracteristicas() != null && model.getCaracteristicas().length() > 10000) invalido("As características devem ter até 10.000 caracteres.");
        if (model.getCep() != null && !model.getCep().isBlank() && !model.getCep().matches("\\d{5}-?\\d{3}")) invalido("Informe um CEP válido com 8 dígitos.");
        if (model.getDestaque() == null) model.setDestaque(false);
    }

    private String normalizar(String value) { return Normalizer.normalize(value == null ? "" : value, Normalizer.Form.NFD).replaceAll("\\p{M}", "").trim().toLowerCase(Locale.ROOT); }
    private String statusValido(String status) {
        String value = normalizar(status);
        if (!List.of("disponivel", "reservado", "alugado", "vendido").contains(value)) invalido("Selecione uma situação válida para o imóvel.");
        return value;
    }
    private String texto(String value, String mensagem, int max) {
        if (value == null || value.isBlank()) invalido(mensagem);
        if (value.trim().length() > max) invalido("Um dos textos excede o tamanho permitido (" + max + " caracteres).");
        return value.trim();
    }
    private int quantidade(Integer value) { if (value == null) return 0; if (value < 0 || value > 100) invalido("Quartos, banheiros e vagas devem estar entre 0 e 100."); return value; }
    private void valor(BigDecimal value, String mensagem) { if (value == null || value.signum() <= 0 || value.compareTo(new BigDecimal("9999999999999.99")) > 0 || value.scale() > 2) invalido(mensagem); }
    private void invalido(String mensagem) { throw new ResponseStatusException(HttpStatus.BAD_REQUEST, mensagem); }
}
