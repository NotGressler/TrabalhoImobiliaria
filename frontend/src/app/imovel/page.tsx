import { Suspense } from "react";
import PropertyDetails from "../../components/PropertyDetails";

export const metadata = { title: "Detalhes do imóvel | JG Imóveis" };

export default function PropertyPage() {
  return <Suspense fallback={<main className="state-panel" role="status">Carregando imóvel...</main>}><PropertyDetails /></Suspense>;
}
