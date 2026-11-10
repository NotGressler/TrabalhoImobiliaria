import { Suspense } from "react";
import AuthForm from "../../components/AuthForm";
export default function AuthPage() { return <Suspense fallback={<main className="auth-page" role="status">Carregando...</main>}><AuthForm mode="login" /></Suspense>; }
