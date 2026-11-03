package com.example.demo.services;

import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.UUID;
import java.util.List;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;

import com.example.demo.models.FotoImovelModel;
import com.example.demo.models.ImovelModel;
import com.example.demo.repositories.FotoImovelRepository;
import com.example.demo.repositories.ImovelRepository;

@Service
public class FotoImovelService {
    private final FotoImovelRepository fotoImovelRepository;
    private final ImovelRepository imovelRepository;
    private final Path uploadDir;

    public FotoImovelService(FotoImovelRepository fotoImovelRepository,
            ImovelRepository imovelRepository, @Value("${app.upload-dir}") String uploadDir) {
        this.fotoImovelRepository = fotoImovelRepository;
        this.imovelRepository = imovelRepository;
        this.uploadDir = Paths.get(uploadDir).toAbsolutePath().normalize();
    }

    public List<FotoImovelModel> listarFotos() {
        return fotoImovelRepository.findAll();
    }

    private String validarArquivo(MultipartFile arquivo) {
        if (arquivo.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Arquivo vazio");
        }
        String nomeOriginal = StringUtils.cleanPath(
                arquivo.getOriginalFilename() == null ? "" : arquivo.getOriginalFilename());
        if (!StringUtils.hasText(nomeOriginal) || nomeOriginal.contains("/")
                || nomeOriginal.contains("\\") || nomeOriginal.contains(":")) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Nome de arquivo invalido");
        }
        return nomeOriginal;
    }

    @Transactional
    public FotoImovelModel salvarFoto(MultipartFile arquivo, Integer imovelId) {
        String nomeOriginal = validarArquivo(arquivo);
        ImovelModel imovel = imovelRepository.findById(imovelId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Imovel nao encontrado"));
        Path destino = gravarArquivo(arquivo, imovelId, nomeOriginal);
        FotoImovelModel model = new FotoImovelModel();
        model.setCaminho(destino.toString());
        model.setNomeArquivo(destino.getFileName().toString());
        model.setImovel(imovel);
        model.setCapa(false);
        return salvarRegistro(model, destino);
    }

    private Path gravarArquivo(MultipartFile arquivo, Integer imovelId, String nomeOriginal) {
        Path pasta = uploadDir.resolve(String.valueOf(imovelId));
        String nomeFinal = UUID.randomUUID() + "_" + nomeOriginal;
        Path destino = pasta.resolve(nomeFinal);
        try {
            Files.createDirectories(pasta);
            try (InputStream conteudo = arquivo.getInputStream()) {
                Files.copy(conteudo, destino);
            }
        } catch (IOException e) {
            removerArquivo(destino);
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Erro ao salvar a imagem", e);
        }
        if (TransactionSynchronizationManager.isSynchronizationActive()) {
            TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
                @Override
                public void afterCompletion(int status) {
                    if (status != STATUS_COMMITTED) {
                        removerArquivo(destino);
                    }
                }
            });
        }
        return destino;
    }

    private FotoImovelModel salvarRegistro(FotoImovelModel model, Path destino) {
        try {
            return fotoImovelRepository.save(model);
        } catch (RuntimeException e) {
            try {
                Files.deleteIfExists(destino);
            } catch (IOException cleanupError) {
                e.addSuppressed(cleanupError);
            }
            throw e;
        }
    }

    private FotoImovelModel buscarFoto(Integer id) {
        return fotoImovelRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Foto nao encontrada"));
    }

    private Path caminhoArquivo(FotoImovelModel foto) {
        Path caminho = uploadDir.resolve(String.valueOf(foto.getImovel().getId()))
                .resolve(foto.getNomeArquivo()).normalize();
        if (!caminho.startsWith(uploadDir)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Caminho de arquivo invalido");
        }
        return caminho;
    }

    @Transactional
    public FotoImovelModel editarFoto(Integer id, MultipartFile arquivo) {
        String nomeOriginal = validarArquivo(arquivo);
        FotoImovelModel foto = buscarFoto(id);
        Path anterior = caminhoArquivo(foto);
        Path novo = gravarArquivo(arquivo, foto.getImovel().getId(), nomeOriginal);
        foto.setNomeArquivo(novo.getFileName().toString());
        foto.setCaminho(novo.toString());
        FotoImovelModel resultado = salvarRegistro(foto, novo);
        removerAposConfirmacao(anterior);
        return resultado;
    }

    @Transactional
    public void excluirFoto(Integer id) {
        FotoImovelModel foto = buscarFoto(id);
        Path caminho = caminhoArquivo(foto);
        fotoImovelRepository.delete(foto);
        removerAposConfirmacao(caminho);
    }

    @Transactional
    public FotoImovelModel tornarCapa(Integer id) {
        FotoImovelModel foto = buscarFoto(id);
        Integer imovelId = foto.getImovel().getId();
        // Serializa a escolha da capa para o mesmo imovel.
        imovelRepository.findByIdForUpdate(imovelId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Imovel nao encontrado"));
        for (FotoImovelModel outra : fotoImovelRepository.findByImovelId(imovelId)) {
            outra.setCapa(outra.getId().equals(id));
            fotoImovelRepository.save(outra);
        }
        foto.setCapa(true);
        return foto;
    }

    private void removerAposConfirmacao(Path caminho) {
        if (TransactionSynchronizationManager.isSynchronizationActive()) {
            TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
                @Override
                public void afterCommit() {
                    removerArquivo(caminho);
                }
            });
        } else {
            removerArquivo(caminho);
        }
    }

    private void removerArquivo(Path caminho) {
        try {
            Files.deleteIfExists(caminho);
        } catch (IOException e) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Erro ao remover a imagem", e);
        }
    }
}
