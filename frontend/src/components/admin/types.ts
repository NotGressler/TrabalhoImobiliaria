import type { Property, PropertyPhoto } from "../../app/PropertyShowcase";
export type Bairro = { id: number; nome: string; cidade?: string; estado?: string };
export type Tipo = { id: number; nome: string };
export type AdminProperty = Property & { bairro?: Bairro | null; tipoImovel?: Tipo | null; areaConstruida?: number | string | null; complemento?: string | null; cep?: string | null; caracteristicas?: string | null };
export type AdminPhoto = PropertyPhoto & { id: number };
export type LookupKind = "bairro" | "tipo";
export type PropertyPayload = Record<string, string | number | boolean | null | { id: number }>;
export function normalize(value: string | null | undefined) { return (value ?? "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim(); }
export function purpose(property?: AdminProperty | null) {
  const value = normalize(property?.finalidade);
  if (value === "ambos" || (value.includes("vend") && (value.includes("alug") || value.includes("loca")))) return "venda e aluguel";
  if (value.includes("alug") || value.includes("loca")) return "aluguel";
  if (value.includes("vend")) return "venda";
  return Number(property?.precoVenda) > 0 && Number(property?.precoAluguel) > 0 ? "venda e aluguel" : Number(property?.precoAluguel) > 0 ? "aluguel" : "venda";
}
export function createdId(response: Response) {
  const location = response.headers.get("Location");
  const match = location && new URL(location, window.location.origin).pathname.match(/\/(\d+)\/?$/);
  if (!match) throw new Error("Cadastro salvo, mas não foi possível identificar o registro. Atualize a lista antes de tentar novamente.");
  return Number(match[1]);
}
export function friendlyError(error: unknown) { return error instanceof TypeError ? "Não foi possível conectar ao servidor. Tente novamente." : error instanceof Error ? error.message : "Não foi possível concluir a operação."; }
export function money(value: number | string | null | undefined) { return Number(value) > 0 ? Number(value).toLocaleString("pt-BR", { style: "currency", currency: "BRL" }) : "Valor não informado"; }
export const STATUS_LABELS: Record<string, string> = { disponivel: "Disponível", reservado: "Reservado", alugado: "Alugado", vendido: "Vendido" };
