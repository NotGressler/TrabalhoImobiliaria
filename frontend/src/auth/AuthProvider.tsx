"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";

export const API_URL = (process.env.NEXT_PUBLIC_API_URL ?? "").replace(/\/+$/, "");
const TOKEN_KEY = "jg-token";
export type SessionUser = { id: number; nome: string; email: string; tipo: "USER" | "ADMIN"; expiresAt: number };
type Status = "checking" | "authenticated" | "anonymous" | "error";
type Credentials = { email: string; senha: string; nome?: string };
type AuthContextValue = {
  user: SessionUser | null;
  status: Status;
  authenticate: (mode: "login" | "register", data: Credentials) => Promise<void>;
  logout: () => void;
  retry: () => void;
  request: (path: string, options?: RequestInit) => Promise<Response>;
};
const AuthContext = createContext<AuthContextValue | null>(null);
export const homeFor = (user: SessionUser) => user.tipo === "ADMIN" ? "/admin/" : "/cliente/";

async function readSession(token: string, signal?: AbortSignal): Promise<SessionUser> {
  const response = await fetch(`${API_URL}/auth/me`, { headers: { Authorization: `Bearer ${token}` }, cache: "no-store", signal });
  if (response.status === 401 || response.status === 403) throw new Error("expired");
  if (!response.ok) throw new Error("connection");
  const data = await response.json();
  if (!Number.isInteger(data.id) || !["USER", "ADMIN"].includes(data.tipo) || typeof data.nome !== "string" || typeof data.email !== "string" || !Number.isFinite(data.expiresAt)) throw new Error("connection");
  if (data.expiresAt <= Date.now()) throw new Error("expired");
  return data;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [status, setStatus] = useState<Status>("checking");
  const [attempt, setAttempt] = useState(0);
  const generation = useRef(0);

  const clear = useCallback((expired = false) => {
    generation.current++;
    sessionStorage.removeItem(TOKEN_KEY);
    setUser(null);
    // Mantém a proteção em espera até a navegação terminar, evitando dois redirecionamentos.
    setStatus("checking");
    window.location.replace(expired ? "/entrar/?expirada=1" : "/");
  }, []);

  const request = useCallback(async (path: string, options: RequestInit = {}) => {
    const token = sessionStorage.getItem(TOKEN_KEY);
    if (!token) { clear(true); throw new Error("Sua sessão expirou. Entre novamente."); }
    const headers = new Headers(options.headers);
    headers.set("Authorization", `Bearer ${token}`);
    const response = await fetch(`${API_URL}${path}`, { ...options, headers, cache: "no-store" });
    if (response.status === 401) { clear(true); throw new Error("Sua sessão expirou. Entre novamente."); }
    if (!response.ok) {
      const body = await response.json().catch(() => null);
      if (response.status === 403) throw new Error("Acesso negado para esta conta.");
      if ([400, 404, 409, 413].includes(response.status) && typeof body?.message === "string") throw new Error(body.message);
      throw new Error("Não foi possível concluir a solicitação. Tente novamente.");
    }
    return response;
  }, [clear]);

  useEffect(() => {
    const controller = new AbortController();
    const version = ++generation.current;
    async function restore() {
      const token = sessionStorage.getItem(TOKEN_KEY);
      if (!token) { setUser(null); setStatus("anonymous"); return; }
      try {
        const current = await readSession(token, controller.signal);
        if (!controller.signal.aborted && version === generation.current) { setUser(current); setStatus("authenticated"); }
      } catch (error) {
        if (controller.signal.aborted || version !== generation.current) return;
        if (error instanceof Error && error.message === "expired") clear(true);
        else { setUser(null); setStatus("error"); }
      }
    }
    void restore();
    const onFocus = () => { void restore(); };
    window.addEventListener("focus", onFocus);
    const onPageShow = (event: PageTransitionEvent) => { if (event.persisted) void restore(); };
    window.addEventListener("pageshow", onPageShow);
    return () => { controller.abort(); window.removeEventListener("focus", onFocus); window.removeEventListener("pageshow", onPageShow); };
  }, [attempt, clear]);

  useEffect(() => {
    if (!user) return;
    const timer = window.setTimeout(() => clear(true), Math.max(0, user.expiresAt - Date.now()));
    return () => window.clearTimeout(timer);
  }, [user, clear]);

  async function authenticate(mode: "login" | "register", data: Credentials) {
    generation.current++;
    const path = mode === "login" ? "/public/login" : "/auth/register";
    const response = await fetch(`${API_URL}${path}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
    if (!response.ok) {
      const result = await response.json().catch(() => null);
      if ([400, 401, 409].includes(response.status) && typeof result?.message === "string") throw new Error(result.message);
      throw new Error(response.status === 401 ? "E-mail ou senha inválidos." : "Não foi possível concluir. Tente novamente.");
    }
    const result = await response.json().catch(() => null);
    if (typeof result?.token !== "string" || !result.token) throw new Error("Não foi possível iniciar sua sessão.");
    let current: SessionUser;
    try { current = await readSession(result.token); }
    catch { throw new Error("Não foi possível validar sua sessão. Tente entrar novamente."); }
    sessionStorage.setItem(TOKEN_KEY, result.token);
    setUser(current);
    setStatus("authenticated");
    window.location.replace(homeFor(current));
  }

  function logout() { clear(); }
  function retry() { setStatus("checking"); setAttempt((value) => value + 1); }

  return <AuthContext.Provider value={{ user, status, authenticate, logout, retry, request }}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const auth = useContext(AuthContext);
  if (!auth) throw new Error("useAuth requer AuthProvider");
  return auth;
}
