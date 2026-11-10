"use client";

import { useEffect, useState } from "react";
import { useAuth } from "../auth/AuthProvider";

export default function useFavorites(enabled: boolean) {
  const { user, request } = useAuth();
  const userId = user?.id;
  const [ids, setIds] = useState<number[]>([]);
  const [loading, setLoading] = useState(enabled);
  const [error, setError] = useState("");
  const [attempt, setAttempt] = useState(0);
  const [busy, setBusy] = useState<number | null>(null);
  const [message, setMessage] = useState<{ text: string; error: boolean } | null>(null);

  useEffect(() => {
    if (!enabled || !userId) return;
    const controller = new AbortController();
    async function load() {
      try {
        const response = await request("/favoritos", { signal: controller.signal });
        const data: unknown = await response.json().catch(() => null);
        if (!Array.isArray(data) || !data.every((id) => Number.isInteger(id) && id > 0)) throw new Error("Não foi possível carregar seus favoritos.");
        if (!controller.signal.aborted) { setIds(data); setError(""); }
      } catch (failure) {
        if (!controller.signal.aborted) setError(failure instanceof TypeError ? "Não foi possível conectar para carregar seus favoritos." : failure instanceof Error ? failure.message : "Não foi possível carregar seus favoritos.");
      } finally { if (!controller.signal.aborted) setLoading(false); }
    }
    void load();
    return () => controller.abort();
  }, [enabled, userId, request, attempt]);

  function retry() { setLoading(true); setError(""); setAttempt((current) => current + 1); }
  async function toggle(propertyId: number) {
    if (!enabled || loading || error || busy !== null) return;
    const saved = ids.includes(propertyId);
    setBusy(propertyId); setMessage(null);
    try {
      await request(`/favoritos/${propertyId}`, { method: saved ? "DELETE" : "PUT" });
      setIds((current) => saved ? current.filter((id) => id !== propertyId) : [propertyId, ...current.filter((id) => id !== propertyId)]);
      setMessage({ text: saved ? "Imóvel removido dos favoritos." : "Imóvel salvo em Meus favoritos.", error: false });
    } catch (failure) {
      setMessage({ text: failure instanceof TypeError ? "Não foi possível conectar. Tente novamente." : failure instanceof Error ? failure.message : "Não foi possível atualizar seus favoritos.", error: true });
    } finally { setBusy(null); }
  }
  return { ids, loading, error, busy, message, retry, toggle, clearMessage: () => setMessage(null) };
}
