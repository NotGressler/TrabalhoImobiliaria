"use client";
import { useEffect, useRef, useState } from "react";
import { friendlyError, type LookupKind } from "./types";
export default function LookupDialog({ kind, onClose, onSave }: { kind: LookupKind; onClose: () => void; onSave: (body: Record<string, string>) => Promise<void> }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => { dialog.current?.showModal(); }, []);
  return <dialog className="admin-lookup-dialog" ref={dialog} aria-labelledby="lookup-title" onCancel={(event) => { event.preventDefault(); if (!busy) onClose(); }}>
    <p className="eyebrow section-eyebrow">COMPLETAR CADASTRO</p><h2 id="lookup-title">{kind === "bairro" ? "Novo bairro" : "Novo tipo de imóvel"}</h2>
    <form onSubmit={async (event) => { event.preventDefault(); const data = new FormData(event.currentTarget); const body: Record<string, string> = { nome: String(data.get("nome") ?? "").trim() }; if (kind === "bairro") { body.cidade = String(data.get("cidade") ?? "").trim(); body.estado = String(data.get("estado") ?? "").trim().toUpperCase(); } if (!body.nome || (kind === "bairro" && !body.cidade)) { setError("Preencha os campos obrigatórios."); return; } setBusy(true); setError(""); try { await onSave(body); } catch (failure) { setError(friendlyError(failure)); setBusy(false); } }}>
      <fieldset disabled={busy} className="admin-fieldset">
        <label>Nome *<input name="nome" required maxLength={100} placeholder={kind === "bairro" ? "Ex.: Centro" : "Ex.: Apartamento"} /></label>
        {kind === "bairro" && <><label>Cidade *<input name="cidade" required maxLength={100} /></label><label>Estado (UF) *<input name="estado" required minLength={2} maxLength={2} pattern="[A-Za-z]{2}" placeholder="RS" /></label></>}
      </fieldset>
      {error && <p className="form-error" role="alert">{error}</p>}
      <div className="admin-confirm-actions"><button className="secondary-button" type="button" disabled={busy} onClick={onClose}>Cancelar</button><button className="primary-button" type="submit" disabled={busy}>{busy ? "Salvando..." : "Salvar"}</button></div>
    </form>
  </dialog>;
}
