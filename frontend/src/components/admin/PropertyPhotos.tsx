"use client";
import { useRef, useEffect, useState } from "react";
import { useAuth, API_URL } from "../../auth/AuthProvider";
import PropertyImage from "../PropertyImage";
import { friendlyError, type AdminPhoto } from "./types";

export default function PropertyPhotos({ photos, onChange }: { photos: AdminPhoto[]; onChange: () => Promise<void> }) {
  const { request } = useAuth();
  const [busy, setBusy] = useState<number | null>(null);
  const [error, setError] = useState("");
  async function act(photo: AdminPhoto, remove: boolean) {
    if (busy !== null) return;
    if (remove && !window.confirm("Excluir esta foto do imóvel?")) return;
    setBusy(photo.id); setError("");
    try { await request(remove ? `/fotos/${photo.id}` : `/fotos/${photo.id}/capa`, { method: remove ? "DELETE" : "PATCH" }); await onChange(); }
    catch (failure) { setError(friendlyError(failure)); }
    finally { setBusy(null); }
  }
  return <>
    {photos.length > 0 && <div className="admin-photo-list">{photos.map((photo) => <div className="admin-photo" key={photo.id}>
      <div className="admin-photo-image"><PropertyImage src={`${API_URL}/fotos/${photo.imovelId}/${encodeURIComponent(photo.nomeArquivo)}`} alt={photo.capa ? "Foto de capa do imóvel" : "Foto do imóvel"} /></div>
      <span>{photo.capa ? "Capa do anúncio" : "Foto do imóvel"}</span>
      <button className="text-button" type="button" disabled={busy !== null || Boolean(photo.capa)} onClick={() => { void act(photo, false); }}>{photo.capa ? "Capa selecionada" : "Usar como capa"}</button>
      <button className="admin-danger-link" type="button" disabled={busy !== null} onClick={() => { void act(photo, true); }}>{busy === photo.id ? "Aguarde..." : "Excluir foto"}</button>
    </div>)}</div>}
    {photos.length > 0 && <p className="admin-help">A escolha da capa e a exclusão de fotos são salvas imediatamente.</p>}
    {error && <p className="form-error" role="alert">{error}</p>}
  </>;
}

export function DeletePropertyDialog({ title, onClose, onConfirm }: { title: string; onClose: () => void; onConfirm: () => Promise<void> }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => { dialog.current?.showModal(); }, []);
  return <dialog className="admin-confirm-dialog" ref={dialog} aria-labelledby="delete-title" onCancel={(event) => { event.preventDefault(); if (!busy) onClose(); }}>
    <div className="admin-confirm-icon" aria-hidden="true">!</div><h2 id="delete-title">Excluir imóvel?</h2>
    <p><strong>{title}</strong></p><p>O anúncio, suas fotos e os vínculos de favoritos serão removidos. Esta ação não pode ser desfeita.</p>
    {error && <p className="form-error" role="alert">{error}</p>}
    <div className="admin-confirm-actions"><button className="secondary-button" type="button" disabled={busy} onClick={onClose}>Cancelar</button><button className="admin-danger-button" type="button" disabled={busy} onClick={async () => { setBusy(true); setError(""); try { await onConfirm(); } catch (failure) { setError(friendlyError(failure)); setBusy(false); } }}>{busy ? "Excluindo..." : "Sim, excluir imóvel"}</button></div>
  </dialog>;
}
