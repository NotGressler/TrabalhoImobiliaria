"use client";

import { useEffect, useState } from "react";
import PropertyShowcase, { type Property, type PropertyPhoto } from "../app/PropertyShowcase";

const apiUrl = (process.env.NEXT_PUBLIC_API_URL ?? "").replace(/\/+$/, "");

async function getList<T>(path: string, signal: AbortSignal): Promise<T[]> {
  const response = await fetch(`${apiUrl}${path}`, { signal, cache: "no-store" });
  if (!response.ok) throw new Error(`Erro ${response.status}`);
  const data: unknown = await response.json();
  if (!Array.isArray(data)) throw new Error("Resposta inesperada da API.");
  return data as T[];
}

export default function ShowcasePage({ clientArea = false }: { clientArea?: boolean }) {
  const [properties, setProperties] = useState<Property[]>([]);
  const [photos, setPhotos] = useState<PropertyPhoto[]>([]);
  const [loading, setLoading] = useState(true);
  const [propertiesError, setPropertiesError] = useState<string | null>(null);
  const [photosError, setPhotosError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    async function load() {
      try {
        const data = await getList<Property>("/imoveis", controller.signal);
        if (controller.signal.aborted) return;
        setProperties(data);
        try {
          const pictures = await getList<PropertyPhoto>("/fotos/vitrine", controller.signal);
          if (!controller.signal.aborted) setPhotos(pictures);
        } catch {
          if (!controller.signal.aborted) setPhotosError("Os imóveis foram carregados, mas as fotos não estão disponíveis no momento.");
        }
      } catch {
        if (!controller.signal.aborted) setPropertiesError("Não foi possível carregar os imóveis. Tente novamente em instantes.");
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }
    void load();
    return () => controller.abort();
  }, []);

  return <PropertyShowcase clientArea={clientArea} loading={loading} properties={properties} photos={photos} apiUrl={apiUrl} propertiesError={propertiesError} photosError={photosError} />;
}
