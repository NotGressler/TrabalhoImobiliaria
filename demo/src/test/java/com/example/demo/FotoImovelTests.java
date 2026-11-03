package com.example.demo;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Optional;
import java.util.List;
import java.awt.image.BufferedImage;
import java.io.ByteArrayOutputStream;
import javax.imageio.ImageIO;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import org.springframework.context.annotation.Configuration;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.mock.web.MockServletContext;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.context.support.AnnotationConfigWebApplicationContext;
import org.springframework.web.servlet.config.annotation.EnableWebMvc;
import org.springframework.transaction.support.TransactionSynchronizationManager;
import org.springframework.transaction.support.TransactionSynchronization;

import com.example.demo.config.WebConfig;
import com.example.demo.controllers.FotoImovelController;
import com.example.demo.models.FotoImovelModel;
import com.example.demo.models.ImovelModel;
import com.example.demo.repositories.FotoImovelRepository;
import com.example.demo.repositories.ImovelRepository;
import com.example.demo.services.FotoImovelService;

class FotoImovelTests {
    @TempDir Path pasta;
    FotoImovelRepository fotos;
    ImovelRepository imoveis;
    FotoImovelService service;

    @BeforeEach
    void preparar() {
        fotos = mock(FotoImovelRepository.class);
        imoveis = mock(ImovelRepository.class);
        ImovelModel imovel = new ImovelModel();
        imovel.setId(1);
        when(imoveis.findById(1)).thenReturn(Optional.of(imovel));
        when(fotos.save(any(FotoImovelModel.class))).thenAnswer(invocation -> {
            FotoImovelModel foto = invocation.getArgument(0);
            foto.setId(10);
            return foto;
        });
        service = new FotoImovelService(fotos, imoveis, pasta.toString());
    }

    @Test
    void uploadGravaArquivoEGetDevolveMesmosBytes() throws Exception {
        ByteArrayOutputStream buffer = new ByteArrayOutputStream();
        ImageIO.write(new BufferedImage(2, 2, BufferedImage.TYPE_INT_RGB), "jpg", buffer);
        byte[] imagem = buffer.toByteArray();
        try (AnnotationConfigWebApplicationContext context = new AnnotationConfigWebApplicationContext()) {
            context.setServletContext(new MockServletContext());
            context.addBeanFactoryPostProcessor(factory -> {
                factory.registerSingleton("webConfig", new WebConfig(pasta.toString()));
                factory.registerSingleton("fotoController", new FotoImovelController(service));
            });
            context.register(MvcConfig.class);
            context.refresh();
            MockMvc mvc = MockMvcBuilders.webAppContextSetup(context).build();
            mvc.perform(multipart("/fotos")
                    .file(new MockMultipartFile("arquivo", "foto.jpg", "image/jpeg", imagem))
                    .param("imovelId", "1"))
                    .andExpect(status().isOk());
            Path arquivo;
            try (var arquivos = Files.list(pasta.resolve("1"))) {
                arquivo = arquivos.findFirst().orElseThrow();
            }
            assertArrayEquals(imagem, Files.readAllBytes(arquivo));
            mvc.perform(get("/fotos/1/" + arquivo.getFileName()))
                    .andExpect(status().isOk())
                    .andExpect(content().contentType("image/jpeg"))
                    .andExpect(content().bytes(imagem));
            mvc.perform(get("/fotos/1/inexistente.jpg")).andExpect(status().isNotFound());
        }
    }

    @Test
    void arquivoVazioRetorna400() throws Exception {
        MockMvc mvc = MockMvcBuilders.standaloneSetup(new FotoImovelController(service)).build();
        mvc.perform(multipart("/fotos")
                .file(new MockMultipartFile("arquivo", "foto.jpg", "image/jpeg", new byte[0]))
                .param("imovelId", "1")).andExpect(status().isBadRequest());
        verifyNoInteractions(fotos);
    }

    @Test
    void imovelInexistenteRetorna404() throws Exception {
        MockMvc mvc = MockMvcBuilders.standaloneSetup(new FotoImovelController(service)).build();
        mvc.perform(multipart("/fotos")
                .file(new MockMultipartFile("arquivo", "foto.jpg", "image/jpeg", new byte[]{1}))
                .param("imovelId", "999")).andExpect(status().isNotFound());
        verifyNoInteractions(fotos);
    }

    @Test
    void falhaNoBancoRemoveArquivo() throws Exception {
        when(fotos.save(any(FotoImovelModel.class))).thenThrow(new IllegalStateException("Falha no banco"));
        assertThrows(IllegalStateException.class, () -> service.salvarFoto(
                new MockMultipartFile("arquivo", "foto.jpg", "image/jpeg", new byte[]{1}), 1));
        try (var arquivos = Files.list(pasta.resolve("1"))) {
            assertEquals(0, arquivos.count());
        }
    }

    @Configuration
    @EnableWebMvc
    static class MvcConfig {
    }

    private FotoImovelModel fotoExistente() throws Exception {
        FotoImovelModel foto = service.salvarFoto(
                new MockMultipartFile("arquivo", "antiga.jpg", "image/jpeg", new byte[]{1, 2}), 1);
        when(fotos.findById(foto.getId())).thenReturn(Optional.of(foto));
        return foto;
    }

    @Test
    void editarMantemIdECapaTrocaArquivo() throws Exception {
        FotoImovelModel foto = fotoExistente();
        foto.setCapa(true);
        foto.setOrdem(2);
        Path antigo = Path.of(foto.getCaminho());
        MockMvc mvc = MockMvcBuilders.standaloneSetup(new FotoImovelController(service)).build();
        mvc.perform(multipart("/fotos/10").file(
                new MockMultipartFile("arquivo", "nova.jpg", "image/jpeg", new byte[]{3, 4}))
                .with(request -> { request.setMethod("PUT"); return request; }))
                .andExpect(status().isOk());
        assertEquals(10, foto.getId());
        assertTrue(foto.getCapa());
        assertEquals(2, foto.getOrdem());
        assertFalse(Files.exists(antigo));
        assertArrayEquals(new byte[]{3, 4}, Files.readAllBytes(Path.of(foto.getCaminho())));
    }

    @Test
    void excluirRemoveRegistroEArquivo() throws Exception {
        FotoImovelModel foto = fotoExistente();
        MockMvc mvc = MockMvcBuilders.standaloneSetup(new FotoImovelController(service)).build();
        mvc.perform(delete("/fotos/10")).andExpect(status().isNoContent());
        verify(fotos).delete(foto);
        assertFalse(Files.exists(Path.of(foto.getCaminho())));
    }

    @Test
    void capaDesmarcaAnteriorNoMesmoImovel() throws Exception {
        FotoImovelModel escolhida = fotoExistente();
        FotoImovelModel anterior = new FotoImovelModel();
        anterior.setId(11);
        anterior.setImovel(escolhida.getImovel());
        anterior.setCapa(true);
        when(imoveis.findByIdForUpdate(1)).thenReturn(Optional.of(escolhida.getImovel()));
        when(fotos.findByImovelId(1)).thenReturn(List.of(escolhida, anterior));
        MockMvc mvc = MockMvcBuilders.standaloneSetup(new FotoImovelController(service)).build();
        mvc.perform(patch("/fotos/10/capa")).andExpect(status().isOk());
        assertTrue(escolhida.getCapa());
        assertFalse(anterior.getCapa());
        verify(fotos).findByImovelId(1);
        verify(fotos).save(anterior);
    }

    @Test
    void operacoesEmFotoInexistenteRetornam404() throws Exception {
        MockMvc mvc = MockMvcBuilders.standaloneSetup(new FotoImovelController(service)).build();
        mvc.perform(delete("/fotos/999")).andExpect(status().isNotFound());
        mvc.perform(patch("/fotos/999/capa")).andExpect(status().isNotFound());
        mvc.perform(multipart("/fotos/999").file(
                new MockMultipartFile("arquivo", "nova.jpg", "image/jpeg", new byte[]{3}))
                .with(request -> { request.setMethod("PUT"); return request; }))
                .andExpect(status().isNotFound());
        verify(fotos, never()).delete(any(FotoImovelModel.class));
    }

    @Test
    void rollbackDaEdicaoPreservaAntigaERemoveNova() throws Exception {
        FotoImovelModel foto = fotoExistente();
        Path antigo = Path.of(foto.getCaminho());
        TransactionSynchronizationManager.initSynchronization();
        try {
            service.editarFoto(10, new MockMultipartFile("arquivo", "nova.jpg", "image/jpeg", new byte[]{3}));
            Path novo = Path.of(foto.getCaminho());
            assertTrue(Files.exists(antigo));
            for (var callback : TransactionSynchronizationManager.getSynchronizations()) {
                callback.afterCompletion(TransactionSynchronization.STATUS_ROLLED_BACK);
            }
            assertTrue(Files.exists(antigo));
            assertFalse(Files.exists(novo));
        } finally {
            TransactionSynchronizationManager.clearSynchronization();
        }
    }
}
