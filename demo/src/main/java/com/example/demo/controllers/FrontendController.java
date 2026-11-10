package com.example.demo.controllers;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

@Controller
public class FrontendController {
    @GetMapping({"/entrar", "/entrar/"})
    public String login() { return "forward:/entrar/index.html"; }

    @GetMapping({"/cadastro", "/cadastro/"})
    public String register() { return "forward:/cadastro/index.html"; }

    @GetMapping({"/cliente", "/cliente/"})
    public String client() { return "forward:/cliente/index.html"; }

    @GetMapping({"/admin", "/admin/"})
    public String admin() { return "forward:/admin/index.html"; }
}
