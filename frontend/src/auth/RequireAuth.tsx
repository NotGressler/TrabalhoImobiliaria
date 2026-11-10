"use client";

import { useEffect, type ReactNode } from "react";
import { homeFor, useAuth } from "./AuthProvider";

export default function RequireAuth({ role, children }: { role: "USER" | "ADMIN"; children: ReactNode }) {
  const { user, status, retry, logout } = useAuth();
  useEffect(() => {
    if (status === "anonymous") window.location.replace("/entrar/");
    else if (status === "authenticated" && user && user.tipo !== role) window.location.replace(homeFor(user));
  }, [status, user, role]);

  if (status === "error") return <main className="auth-page"><div className="auth-card" role="alert"><h1>Não conseguimos validar sua sessão</h1><p>Confira sua conexão e tente novamente.</p><button className="primary-button" onClick={retry}>Tentar novamente</button><button className="text-button" onClick={logout}>Sair da conta</button></div></main>;
  if (status !== "authenticated" || !user || user.tipo !== role) return <main className="auth-page"><div className="state-panel" role="status"><span className="loading-spinner" />Validando sua sessão...</div></main>;
  return children;
}
