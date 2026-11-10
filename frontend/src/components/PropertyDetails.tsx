"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { API_URL, homeFor, useAuth } from "../auth/AuthProvider";
import { amountOf, formatArea, formatCurrency, hasPrice, Icon, normalize, photosFor, purposeOf, type Property, type PropertyPhoto } from "../lib/property";
import useFavorites from "../hooks/useFavorites";
import PropertyGallery from "./PropertyGallery";
import PropertyContact from "./PropertyContact";

export default function PropertyDetails() {
  const params = useSearchParams();
  const id = params.get("id") ?? "";
  const { user, status, logout } = useAuth();
  const favorites = useFavorites(user?.tipo === "USER");
  const back = params.get("origem") === "cliente" && user?.tipo === "USER" ? "/cliente/#imoveis" : "/#imoveis";
  const [property, setProperty] = useState<Property | null>(null);
  const [photos, setPhotos] = useState<PropertyPhoto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [photoError, setPhotoError] = useState(false);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    async function load() {
      setLoading(true); setError(""); setPhotoError(false); setProperty(null); setPhotos([]);
      try {
        if (!/^[1-9]\d*$/.test(id) || !Number.isSafeInteger(Number(id))) throw new Error("O endereço deste imóvel é inválido. Escolha um anúncio na vitrine.");
        const response = await fetch(`${API_URL}/imoveis/${id}`, { signal: controller.signal, cache: "no-store" });
        if (response.status === 404) throw new Error("Imóvel não encontrado. O anúncio pode ter sido removido.");
        if (!response.ok) throw new Error("Não foi possível carregar este imóvel. Tente novamente.");
        const item: Property = await response.json();
        if (!item || item.id !== Number(id)) throw new Error("Não foi possível carregar os dados deste imóvel.");
        if (controller.signal.aborted) return;
        setProperty(item);
        try {
          const pictures = await fetch(`${API_URL}/fotos/vitrine`, { signal: controller.signal, cache: "no-store" });
          if (!pictures.ok) throw new Error("Fotos indisponíveis");
          const data: PropertyPhoto[] = await pictures.json();
          if (!Array.isArray(data)) throw new Error("Fotos inválidas");
          if (!controller.signal.aborted) setPhotos(photosFor(item.id, data));
        } catch { if (!controller.signal.aborted) setPhotoError(true); }
      } catch (failure) {
        if (!controller.signal.aborted) setError(failure instanceof TypeError ? "Não foi possível conectar ao servidor. Confira sua conexão." : failure instanceof Error ? failure.message : "Não foi possível carregar o imóvel.");
      } finally { if (!controller.signal.aborted) setLoading(false); }
    }
    void load();
    return () => controller.abort();
  }, [id, attempt]);

  useEffect(() => {
    document.title = property ? `${property.titulo || `Imóvel #${property.id}`} | JG Imóveis` : "Detalhes do imóvel | JG Imóveis";
  }, [property]);

  const purpose = property ? purposeOf(property) : null;
  const both = property && !purpose && hasPrice(property.precoVenda) && hasPrice(property.precoAluguel);
  return <main className="property-page">
    <header className="site-header"><div className="page-shell header-inner">
      <a className="brand" href="/" aria-label="JG Imóveis, início"><Image src="/images/logo-jg.png" alt="JG Imóveis" width={1536} height={1024} unoptimized priority /></a>
      <div className="account-menu">{status === "authenticated" && user ? <><a className="account-link" href={homeFor(user)}>{user.tipo === "ADMIN" ? "Área do admin" : "Minha área"}</a><button className="primary-button login-button" type="button" onClick={logout}>Sair</button></> : status === "checking" ? <span role="status">Carregando...</span> : <a className="primary-button login-button" href="/entrar/">Fazer login</a>}</div>
    </div></header>
    <div className="page-shell property-page-main">
      <a className="property-back" href={back}>← Voltar para os imóveis</a>
      {loading ? <div className="state-panel" role="status"><span className="loading-spinner" />Carregando imóvel...</div>
        : error ? <div className="state-panel" role="alert"><h1>Não conseguimos abrir este imóvel</h1><p>{error}</p><button className="primary-button" type="button" onClick={() => setAttempt((value) => value + 1)}>Tentar novamente</button></div>
        : property && <>
          <div className="property-page-heading"><p className="eyebrow section-eyebrow">{both ? "VENDA E LOCAÇÃO" : purpose === "aluguel" ? "PARA ALUGAR" : "À VENDA"} · CÓD. {String(property.id).padStart(4, "0")}</p><h1>{property.titulo || `${property.tipoImovel?.nome ?? "Imóvel"} disponível`}</h1><p className="card-location"><Icon name="pin" size={16} />{[property.endereco, property.numero, property.bairro?.nome, property.bairro?.cidade].filter(Boolean).join(", ") || "Localização não informada"}</p></div>
          <div className="property-page-grid">
            <div className="property-page-info">
              <PropertyGallery key={`${property.id}-${attempt}`} photos={photos} apiUrl={API_URL} title={property.titulo || "Imóvel"} />
              {photoError && <p className="property-photo-warning" role="status">Não foi possível carregar as fotos. <button className="text-button" type="button" onClick={() => setAttempt((value) => value + 1)}>Tentar novamente</button></p>}
              <section className="property-page-description" aria-labelledby="property-about"><h2 id="property-about">Conheça este imóvel</h2><div className="modal-features"><span><Icon name="bed" />{property.dormitorios ?? "—"} quartos</span><span><Icon name="bath" />{property.banheiros ?? "—"} banheiros</span><span><Icon name="car" />{property.garagem ?? "—"} vagas</span>{formatArea(property.areaTotal) && <span>{formatArea(property.areaTotal)}</span>}</div><p className="modal-description">{property.descricao || "Mais informações sobre este imóvel em breve."}</p></section>
            </div>
            <aside className="property-page-sidebar" aria-label="Valores e contato">
              <section className="property-value-card" aria-label="Valores do imóvel">
                {normalize(property.status) !== "disponivel" && <p className="saved-property-status">Situação: {property.status || "Não informada"}</p>}
                {both ? <><span className="price-label">VALOR DE VENDA</span><p className="modal-price">{formatCurrency(property.precoVenda)}</p><span className="price-label">ALUGUEL MENSAL</span><p className="modal-price">{formatCurrency(property.precoAluguel)}<span>/mês</span></p></> : <><span className="price-label">{purpose === "aluguel" ? "ALUGUEL MENSAL" : "VALOR DO IMÓVEL"}</span><p className="modal-price">{formatCurrency(amountOf(property, purpose ?? "todos"))}{purpose === "aluguel" && <span>/mês</span>}</p></>}
                {user?.tipo === "USER" && <div className="property-page-favorite"><button className="secondary-button" type="button" aria-pressed={favorites.ids.includes(property.id)} disabled={favorites.loading || Boolean(favorites.error) || favorites.busy !== null} onClick={() => { void favorites.toggle(property.id); }}>{favorites.busy !== null ? "Salvando..." : favorites.ids.includes(property.id) ? "♥ Remover dos favoritos" : "♡ Favoritar imóvel"}</button>{favorites.error && <p role="alert">{favorites.error} <button className="text-button" type="button" onClick={favorites.retry}>Tentar novamente</button></p>}{favorites.message && <p role={favorites.message.error ? "alert" : "status"}>{favorites.message.text}</p>}</div>}
              </section>
              <PropertyContact key={property.id} propertyId={property.id} />
            </aside>
          </div>
        </>}
    </div>
  </main>;
}
