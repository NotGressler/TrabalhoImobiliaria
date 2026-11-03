import PropertyShowcase, { type Property, type PropertyPhoto } from "./PropertyShowcase";

const apiUrl = (process.env.API_URL ?? "http://localhost:8080").replace(/\/+$/, "");

async function getProperties(): Promise<Property[]> {
  const response = await fetch(`${apiUrl}/imoveis`, { cache: "no-store" });
  if (!response.ok) {
    throw new Error(`O servidor respondeu com o erro ${response.status}.`);
  }

  const data: unknown = await response.json();
  if (!Array.isArray(data)) {
    throw new Error("A resposta de imóveis da API está em um formato inesperado.");
  }

  return data as Property[];
}

async function getPhotos(): Promise<PropertyPhoto[]> {
  const response = await fetch(`${apiUrl}/fotos/vitrine`, { cache: "no-store" });
  if (!response.ok) {
    throw new Error(`O servidor respondeu com o erro ${response.status}.`);
  }

  const data: unknown = await response.json();
  if (!Array.isArray(data)) {
    throw new Error("A resposta de fotos da API está em um formato inesperado.");
  }

  return data as PropertyPhoto[];
}

export default async function Home() {
  let properties: Property[] = [];
  let photos: PropertyPhoto[] = [];
  let propertiesError: string | null = null;
  let photosError: string | null = null;

  try {
    properties = await getProperties();
  } catch {
    propertiesError =
      "Não foi possível carregar os imóveis. Verifique se o backend Spring está iniciado e tente novamente.";
  }

  if (!propertiesError) {
    try {
      photos = await getPhotos();
    } catch {
      photosError = "Os imóveis foram carregados, mas as fotos não estão disponíveis no momento.";
    }
  }

  return (
    <PropertyShowcase
      properties={properties}
      photos={photos}
      apiUrl={apiUrl}
      propertiesError={propertiesError}
      photosError={photosError}
    />
  );
}
