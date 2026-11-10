"use client";

import { useRef, useState } from "react";
import { API_URL, useAuth } from "../auth/AuthProvider";

export default function PropertyContact({ propertyId }: { propertyId: number }) {
  const { user } = useAuth();
  const sending = useRef(false);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<{ error: boolean; text: string } | null>(null);

  return <section className="property-contact" aria-labelledby="property-contact-title">
    <div className="property-contact-heading"><span className="property-contact-icon" aria-hidden="true">↗</span><div><h3 id="property-contact-title">Entrar em contato</h3><p>Gostou deste imóvel? Fale com a nossa equipe.</p></div></div>
    <form onSubmit={async (event) => {
      event.preventDefault();
      if (sending.current) return;
      const data = new FormData(event.currentTarget);
      const text = (key: string) => String(data.get(key) ?? "").trim();
      const body = { nome: text("nome"), telefone: text("telefone"), email: text("email"), mensagem: text("mensagem") };
      if (!body.nome || !body.mensagem) { setResult({ error: true, text: "Preencha seu nome e a mensagem." }); return; }
      if (!/^\d{10,11}$/.test(body.telefone.replace(/\D/g, ""))) { setResult({ error: true, text: "Informe um telefone com DDD e 10 ou 11 dígitos." }); return; }
      sending.current = true; setBusy(true); setResult(null);
      try {
        const response = await fetch(`${API_URL}/imoveis/sabermais/${propertyId}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
        if (!response.ok) {
          throw new Error(response.status === 404 ? "Este imóvel não está mais disponível. Atualize a vitrine." : response.status === 400 ? "Confira os dados informados e tente novamente." : "Não foi possível enviar sua mensagem agora. Tente novamente em instantes.");
        }
        setResult({ error: false, text: "Mensagem enviada! Nossa equipe recebeu seu interesse e poderá entrar em contato pelos dados informados." });
      } catch (error) {
        setResult({ error: true, text: error instanceof TypeError ? "Não foi possível conectar ao servidor. Confira sua conexão e tente novamente." : error instanceof Error ? error.message : "Não foi possível enviar. Tente novamente." });
      } finally { sending.current = false; setBusy(false); }
    }}>
      <fieldset disabled={busy}>
        <div className="property-contact-row">
          <label>Nome <span>*</span><input name="nome" autoComplete="name" required maxLength={100} defaultValue={user?.nome ?? ""} placeholder="Digite seu nome" /></label>
          <label>Telefone <span>*</span><div className="property-contact-phone"><span aria-label="Brasil">🇧🇷</span><input name="telefone" type="tel" inputMode="tel" autoComplete="tel-national" required maxLength={16} placeholder="(11) 99123-4567" /></div></label>
        </div>
        <label>E-mail <span>*</span><input name="email" type="email" autoComplete="email" required maxLength={254} defaultValue={user?.email ?? ""} placeholder="Digite seu e-mail" /></label>
        <label>Mensagem <span>*</span><textarea name="mensagem" required rows={4} maxLength={2000} defaultValue={`Olá, vi o anúncio do imóvel e gostaria de mais informações. Aguardo seu contato.`} /></label>
        <button className="primary-button" type="submit">{busy ? "Enviando mensagem..." : "Enviar mensagem"}<span aria-hidden="true">↗</span></button>
      </fieldset>
      {result && <p className={`property-contact-result${result.error ? " is-error" : ""}`} role={result.error ? "alert" : "status"}>{result.text}</p>}
    </form>
  </section>;
}
