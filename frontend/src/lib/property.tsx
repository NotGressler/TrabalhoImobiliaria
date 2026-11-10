export type Property = {
  id: number;
  titulo?: string | null;
  descricao?: string | null;
  finalidade?: string | null;
  status?: string | null;
  dormitorios?: number | null;
  banheiros?: number | null;
  garagem?: number | null;
  areaTotal?: number | string | null;
  precoVenda?: number | string | null;
  precoAluguel?: number | string | null;
  endereco?: string | null;
  numero?: string | null;
  bairro?: { nome?: string | null; cidade?: string | null; estado?: string | null } | null;
  tipoImovel?: { nome?: string | null } | null;
  destaque?: boolean | null;
};

export type PropertyPhoto = {
  imovelId: number;
  nomeArquivo: string;
  capa?: boolean | null;
  ordem?: number | null;
};



export type Purpose = "todos" | "venda" | "aluguel";

export function normalize(value: string | null | undefined) {
  return (value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

export function purposeOf(property: Property): Exclude<Purpose, "todos"> | null {
  const purpose = normalize(property.finalidade);
  if (purpose === "ambos" || (purpose.includes("vend") && (purpose.includes("alug") || purpose.includes("loca")))) return null;
  if (purpose.includes("vend")) return "venda";
  if (purpose.includes("alug") || purpose.includes("loca")) return "aluguel";
  if (hasPrice(property.precoAluguel) && !hasPrice(property.precoVenda)) return "aluguel";
  if (hasPrice(property.precoVenda) && !hasPrice(property.precoAluguel)) return "venda";
  return null;
}

export function hasPrice(value: number | string | null | undefined) {
  const amount = Number(value);
  return value != null && value !== "" && Number.isFinite(amount) && amount > 0;
}

export function supportsPurpose(property: Property, purpose: Exclude<Purpose, "todos">) {
  const declaredPurpose = purposeOf(property);
  if (declaredPurpose) return declaredPurpose === purpose;
  return purpose === "venda" ? hasPrice(property.precoVenda) : hasPrice(property.precoAluguel);
}

export function amountOf(property: Property, purpose: Purpose) {
  if (purpose === "aluguel") return property.precoAluguel;
  if (purpose === "venda") return property.precoVenda;
  if (hasPrice(property.precoVenda)) return property.precoVenda;
  return hasPrice(property.precoAluguel) ? property.precoAluguel : null;
}

export function formatCurrency(value: number | string | null | undefined) {
  if (value == null || value === "") return "Consulte o valor";
  const amount = Number(value);
  if (!Number.isFinite(amount)) return "Consulte o valor";
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatArea(value: number | string | null | undefined) {
  if (value == null || value === "") return null;
  const area = Number(value);
  return Number.isFinite(area) ? `${area} m²` : null;
}

export function Icon({
  name,
  size = 18,
}: {
  name: "search" | "pin" | "bed" | "bath" | "car" | "arrow" | "close";
  size?: number;
}) {
  const common = {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.7,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true as const,
  };

  switch (name) {
    case "search":
      return <svg {...common}><circle cx="11" cy="11" r="7" /><path d="m20 20-4-4" /></svg>;
    case "pin":
      return <svg {...common}><path d="M20 10c0 5-8 12-8 12S4 15 4 10a8 8 0 1 1 16 0Z" /><circle cx="12" cy="10" r="2.5" /></svg>;
    case "bed":
      return <svg {...common}><path d="M3 19v-8a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v8M3 15h18M7 9V6h4v3M3 19v2m18-2v2" /></svg>;
    case "bath":
      return <svg {...common}><path d="M4 12h16v3a5 5 0 0 1-5 5H9a5 5 0 0 1-5-5v-3ZM6 12V5a2 2 0 0 1 4 0v1M3 20l-1 2m19-2 1 2" /></svg>;
    case "car":
      return <svg {...common}><path d="m5 11 1.5-5h11l1.5 5M3 16v-3a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v3M5 16h14M6 16v2m12-2v2" /><circle cx="7" cy="13.5" r=".7" /><circle cx="17" cy="13.5" r=".7" /></svg>;
    case "arrow":
      return <svg {...common}><path d="M5 12h14m-6-6 6 6-6 6" /></svg>;
    case "close":
      return <svg {...common}><path d="m18 6-12 12M6 6l12 12" /></svg>;
  }
}

export function photosFor(propertyId: number, photos: PropertyPhoto[]) {
  return photos
    .filter((photo) => photo.imovelId === propertyId)
    .sort((a, b) => Number(Boolean(b.capa)) - Number(Boolean(a.capa)) || (a.ordem ?? Infinity) - (b.ordem ?? Infinity));
}

