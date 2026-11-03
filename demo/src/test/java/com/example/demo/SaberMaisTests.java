package com.example.demo;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

import java.math.BigDecimal;
import java.util.Map;

import com.example.demo.controllers.ImovelController;
import com.example.demo.dtos.SaberMaisDTO;
import com.example.demo.models.ImovelModel;
import com.example.demo.services.EmailService;
import com.example.demo.services.ImovelService;
import jakarta.mail.Session;
import jakarta.mail.internet.MimeMessage;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.test.util.ReflectionTestUtils;
import org.thymeleaf.spring6.SpringTemplateEngine;
import org.thymeleaf.templateresolver.ClassLoaderTemplateResolver;

class SaberMaisTests {
    private ImovelController controller;
    private ImovelService imoveis;
    private EmailService emails;
    private final SaberMaisDTO cliente = new SaberMaisDTO("Maria", "55999999999", "maria@example.com", "Quero uma visita.");

    @BeforeEach
    void preparar() {
        controller = new ImovelController();
        imoveis = mock(ImovelService.class);
        emails = mock(EmailService.class);
        ReflectionTestUtils.setField(controller, "service", imoveis);
        ReflectionTestUtils.setField(controller, "emailService", emails);
    }

    @Test
    void enviaDadosDoImovelAoEmailDoCliente() throws Exception {
        ImovelModel imovel = new ImovelModel();
        imovel.setId(1);
        imovel.setTitulo("Casa com jardim");
        when(imoveis.find(1)).thenReturn(imovel);
        assertEquals(200, controller.saberMais(1, cliente).getStatusCode().value());
        verify(emails).enviarEmailComTemplate(cliente.email(), "Informações sobre o imóvel: Casa com jardim",
                "email/imovel", Map.of("cliente", cliente, "imovel", imovel));
    }

    @Test
    void imovelInexistenteNaoEnviaEmail() {
        assertEquals(404, controller.saberMais(99, cliente).getStatusCode().value());
        verifyNoInteractions(emails);
    }

    @Test
    void camposAusentesOuEmailInvalidoNaoEnviamEmail() {
        assertEquals(400, controller.saberMais(1, new SaberMaisDTO("", null, null, null)).getStatusCode().value());
        assertEquals(400, controller.saberMais(1, new SaberMaisDTO("Maria", "123", "invalido", "Olá")).getStatusCode().value());
        verifyNoInteractions(imoveis, emails);
    }

    @Test
    void falhaNoEnvioNaoRetornaSucesso() throws Exception {
        ImovelModel imovel = new ImovelModel();
        imovel.setTitulo("Casa");
        when(imoveis.find(1)).thenReturn(imovel);
        doThrow(new RuntimeException("SMTP indisponível")).when(emails)
                .enviarEmailComTemplate(anyString(), anyString(), anyString(), anyMap());
        assertEquals(502, controller.saberMais(1, cliente).getStatusCode().value());
    }

    @Test
    void templateGeraHtmlComPrecoEMensagemEscapada() throws Exception {
        ClassLoaderTemplateResolver resolver = new ClassLoaderTemplateResolver();
        resolver.setPrefix("templates/");
        resolver.setSuffix(".html");
        resolver.setCharacterEncoding("UTF-8");
        SpringTemplateEngine engine = new SpringTemplateEngine();
        engine.setTemplateResolver(resolver);
        JavaMailSender sender = mock(JavaMailSender.class);
        MimeMessage mime = new MimeMessage((Session) null);
        when(sender.createMimeMessage()).thenReturn(mime);
        EmailService service = new EmailService(sender, engine);
        ReflectionTestUtils.setField(service, "remetente", "imobiliaria@example.com");
        ImovelModel imovel = new ImovelModel();
        imovel.setId(1);
        imovel.setTitulo("Casa com jardim");
        imovel.setPrecoVenda(new BigDecimal("250000.00"));
        SaberMaisDTO dados = new SaberMaisDTO("Maria", "123", cliente.email(), "<script>alert(1)</script>");
        service.enviarEmailComTemplate(cliente.email(), "Imóvel", "email/imovel", Map.of("cliente", dados, "imovel", imovel));
        jakarta.mail.Multipart multipart = (jakarta.mail.Multipart) mime.getContent();
        jakarta.mail.Multipart alternative = (jakarta.mail.Multipart) multipart.getBodyPart(0).getContent();
        String html = (String) alternative.getBodyPart(0).getContent();
        assertTrue(html.contains("Casa com jardim"));
        assertTrue(html.contains("250.000,00"));
        assertTrue(html.contains("&lt;script&gt;"));
        assertFalse(html.contains("<script>"));
        assertEquals(cliente.email(), mime.getAllRecipients()[0].toString());
        verify(sender).send(mime);
    }
}
