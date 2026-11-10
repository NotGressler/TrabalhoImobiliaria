"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { homeFor, useAuth } from "../auth/AuthProvider";

export default function AuthForm({ mode }: { mode: "login" | "register" }) {
  const register = mode === "register";
  const { authenticate, status, user } = useAuth();
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const expired = useSearchParams().has("expirada");

  useEffect(() => {
    if (status === "authenticated" && user) window.location.replace(homeFor(user));
  }, [status, user]);

  return <main className="auth-page">
    <Link className="brand auth-brand" href="/" aria-label="JG Imóveis, voltar à vitrine"><Image src="/images/logo-jg.png" alt="JG Imóveis" width={1536} height={1024} unoptimized priority /></Link>
    <section className="auth-card" aria-labelledby="auth-title">
      <p className="eyebrow section-eyebrow">SEU PRÓXIMO CAPÍTULO COMEÇA AQUI</p>
      <h1 id="auth-title">{register ? "Crie sua conta" : "Entre na sua conta"}</h1>
      <p className="auth-description">{register ? "Cadastre-se para acessar sua área de cliente e encontrar seu próximo lar." : "Acesse sua conta para continuar buscando o imóvel ideal."}</p>
      {expired && <p className="auth-notice" role="status">Sua sessão expirou. Entre novamente para continuar.</p>}
      <form onSubmit={async (event) => {
        event.preventDefault();
        const data = new FormData(event.currentTarget);
        const senha = String(data.get("senha") ?? "");
        if (register && senha !== data.get("confirmacao")) { setMessage("As senhas precisam ser iguais."); return; }
        if (register && new TextEncoder().encode(senha).length > 72) { setMessage("A senha é muito longa. Use no máximo 72 bytes."); return; }
        setBusy(true); setMessage("");
        try { await authenticate(mode, { email: String(data.get("email") ?? "").trim(), senha, ...(register ? { nome: String(data.get("nome") ?? "").trim() } : {}) }); }
        catch (error) { setMessage(error instanceof TypeError ? "Não foi possível conectar ao servidor. Tente novamente." : error instanceof Error ? error.message : "Não foi possível concluir. Tente novamente."); setBusy(false); }
      }}>
        {register && <label>Nome completo<input name="nome" autoComplete="name" minLength={2} maxLength={100} required placeholder="Como podemos chamar você?" disabled={busy} /></label>}
        <label>E-mail<input name="email" type="email" autoComplete="username" maxLength={254} required placeholder="seu@email.com" disabled={busy} /></label>
        <label>Senha<input name="senha" type="password" autoComplete={register ? "new-password" : "current-password"} minLength={register ? 8 : undefined} maxLength={register ? 72 : undefined} required placeholder={register ? "Pelo menos 8 caracteres" : "Sua senha"} disabled={busy} /></label>
        {register && <label>Confirmar senha<input name="confirmacao" type="password" autoComplete="new-password" minLength={8} maxLength={72} required placeholder="Digite sua senha novamente" disabled={busy} /></label>}
        {message && <p className="form-error" role="alert">{message}</p>}
        <button className="primary-button" type="submit" disabled={busy || status === "checking"}>{busy ? (register ? "Criando sua conta..." : "Entrando...") : register ? "Criar conta e entrar" : "Entrar"}</button>
      </form>
      <p className="auth-switch">{register ? "Já tem uma conta?" : "Ainda não tem uma conta?"} <Link href={register ? "/entrar/" : "/cadastro/"}>{register ? "Fazer login" : "Criar conta"}</Link></p>
    </section>
    <Link className="auth-back" href="/">← Voltar para os imóveis</Link>
  </main>;
}
