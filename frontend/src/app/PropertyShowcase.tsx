"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";

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

type Props = {
  properties: Property[];
  photos: PropertyPhoto[];
  apiUrl: string;
  propertiesError: string | null;
  photosError: string | null;
  loading?: boolean;
};

type Purpose = "todos" | "venda" | "aluguel";

function normalize(value: string | null | undefined) {
  return (value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function purposeOf(property: Property): Exclude<Purpose, "todos"> | null {
  const purpose = normalize(property.finalidade);
  if (purpose.includes("vend")) return "venda";
  if (purpose.includes("alug") || purpose.includes("loca")) return "aluguel";
  if (hasPrice(property.precoAluguel) && !hasPrice(property.precoVenda)) return "aluguel";
  if (hasPrice(property.precoVenda) && !hasPrice(property.precoAluguel)) return "venda";
  return null;
}

function hasPrice(value: number | string | null | undefined) {
  const amount = Number(value);
  return value != null && value !== "" && Number.isFinite(amount) && amount > 0;
}

function supportsPurpose(property: Property, purpose: Exclude<Purpose, "todos">) {
  const declaredPurpose = purposeOf(property);
  if (declaredPurpose) return declaredPurpose === purpose;
  return purpose === "venda" ? hasPrice(property.precoVenda) : hasPrice(property.precoAluguel);
}

function amountOf(property: Property, purpose: Purpose) {
  if (purpose === "aluguel") return property.precoAluguel;
  if (purpose === "venda") return property.precoVenda;
  if (hasPrice(property.precoVenda)) return property.precoVenda;
  return hasPrice(property.precoAluguel) ? property.precoAluguel : null;
}

function formatCurrency(value: number | string | null | undefined) {
  if (value == null || value === "") return "Consulte o valor";
  const amount = Number(value);
  if (!Number.isFinite(amount)) return "Consulte o valor";
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatArea(value: number | string | null | undefined) {
  if (value == null || value === "") return null;
  const area = Number(value);
  return Number.isFinite(area) ? `${area} m²` : null;
}

function Icon({
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

function photoFor(propertyId: number, photos: PropertyPhoto[]) {
  return photos
    .filter((photo) => photo.imovelId === propertyId)
    .sort((a, b) => Number(Boolean(b.capa)) - Number(Boolean(a.capa)) || (a.ordem ?? Infinity) - (b.ordem ?? Infinity))[0];
}

function PropertyImage({ src, alt }: { src: string | null; alt: string }) {
  const [failed, setFailed] = useState(false);

  if (!src || failed) {
    return (
      <div className="image-placeholder" role="img" aria-label={`${alt} sem foto disponível`}>
        <span className="placeholder-sun" />
        <span className="placeholder-building"><i /><i /><i /><i /></span>
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element -- The backend origin is configurable through NEXT_PUBLIC_API_URL.
    <img className="property-image" src={src} alt={alt} onError={() => setFailed(true)} />
  );
}

export default function PropertyShowcase({
  properties,
  photos,
  apiUrl,
  propertiesError,
  photosError,
  loading = false,
}: Props) {
  const [purpose, setPurpose] = useState<Purpose>("todos");
  const [search, setSearch] = useState("");
  const [propertyType, setPropertyType] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [filters, setFilters] = useState({ purpose: "todos" as Purpose, search: "", propertyType: "", maxPrice: "" });
  const [showAll, setShowAll] = useState(false);
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const detailDialog = useRef<HTMLDialogElement>(null);
  const [loginOpen, setLoginOpen] = useState(false);
  const loginDialog = useRef<HTMLDialogElement>(null);
  const [loginMessage, setLoginMessage] = useState("");
  const [loginBusy, setLoginBusy] = useState(false);

  useEffect(() => {
    if (selectedProperty) detailDialog.current?.showModal();
    else detailDialog.current?.close();
  }, [selectedProperty]);

  useEffect(() => {
    if (loginOpen) loginDialog.current?.showModal();
    else loginDialog.current?.close();
  }, [loginOpen]);

  const availableProperties = useMemo(
    () => properties.filter((property) => normalize(property.status) === "disponivel"),
    [properties],
  );

  const visibleProperties = useMemo(() => {
    const query = normalize(filters.search);
    return availableProperties
      .filter((property) => filters.purpose === "todos" || supportsPurpose(property, filters.purpose))
      .filter((property) => !filters.propertyType || property.tipoImovel?.nome === filters.propertyType)
      .filter((property) => {
        if (!filters.maxPrice) return true;
        const amounts = filters.purpose === "todos"
          ? [property.precoVenda, property.precoAluguel]
          : [amountOf(property, filters.purpose)];
        return amounts.some((amount) => hasPrice(amount) && Number(amount) <= Number(filters.maxPrice));
      })
      .filter((property) => {
        if (!query) return true;
        const searchable = [
          property.titulo,
          property.endereco,
          property.bairro?.nome,
          property.bairro?.cidade,
          property.tipoImovel?.nome,
        ]
          .filter(Boolean)
          .join(" ");
        return normalize(searchable).includes(query);
      });
  }, [availableProperties, filters]);

  const types = [...new Set(availableProperties.map((property) => property.tipoImovel?.nome).filter((name): name is string => Boolean(name)))].sort();
  const displayedProperties = showAll ? visibleProperties : visibleProperties.slice().sort((a, b) => Number(Boolean(b.destaque)) - Number(Boolean(a.destaque))).slice(0, 3);

  const imageUrl = (property: Property) => {
    const photo = photoFor(property.id, photos);
    if (!photo?.nomeArquivo) return null;
    return `${apiUrl}/fotos/${property.id}/${encodeURIComponent(photo.nomeArquivo)}`;
  };
  const selectedPurpose = selectedProperty ? purposeOf(selectedProperty) : null;
  const selectedHasBothPurposes =
    selectedProperty != null &&
    selectedPurpose == null &&
    hasPrice(selectedProperty.precoVenda) &&
    hasPrice(selectedProperty.precoAluguel);

  return (
    <main>
      <header className="site-header">
        <div className="page-shell header-inner">
          <a className="brand" href="#inicio" aria-label="JG Imóveis, página inicial">
            <Image src="/images/logo-jg.png" alt="JG Imóveis" width={1536} height={1024} unoptimized priority />
          </a>
          <nav className="main-nav" aria-label="Navegação principal">
            <a href="#imoveis" onClick={() => { setPurpose("venda"); setSearch(""); setPropertyType(""); setMaxPrice(""); setFilters({purpose:"venda", search:"", propertyType:"", maxPrice:""}); setShowAll(true); }}>Comprar</a>
            <a href="#imoveis" onClick={() => { setPurpose("aluguel"); setSearch(""); setPropertyType(""); setMaxPrice(""); setFilters({purpose:"aluguel", search:"", propertyType:"", maxPrice:""}); setShowAll(true); }}>Alugar</a>
            <a href="#sobre">Sobre nós</a>
            <a href="#contato">Contato</a>
          </nav>
          <button className="primary-button login-button" onClick={() => { setLoginMessage(""); setLoginOpen(true); }} type="button">Fazer login</button>
        </div>
      </header>

      <section className="hero" id="inicio" aria-labelledby="hero-title">
        <div className="hero-content page-shell">
          <div className="hero-copy">
            <p className="eyebrow hero-eyebrow">PARA VOCÊ QUE PROCURA UM NOVO LUGAR PRA MORAR</p>
            <h1 id="hero-title">Encontre o imóvel<br />que combina com<br />a sua história.</h1>
            <p className="hero-description">Casas e apartamentos selecionados especialmente para você!</p>
            <div className="hero-actions">
              <a className="primary-button" href="#imoveis">Explorar imóveis <Icon name="arrow" size={16} /></a>
              <span>Seu próximo capítulo começa aqui.</span>
            </div>
          </div>
          <div className="hero-photo">
            <Image src="/images/hero-imobiliaria.jpg" alt="Profissional segurando uma miniatura de casa, simbolizando a conquista de um novo lar" fill sizes="(max-width: 700px) 100vw, 45vw" unoptimized priority />
          </div>
        </div>
      </section>

      <form className="search-panel page-shell" onSubmit={(event) => {
        event.preventDefault();
        setFilters({purpose, search, propertyType, maxPrice});
        setShowAll(true);
        document.getElementById("imoveis")?.scrollIntoView({behavior:"smooth"});
      }}>
        <h2>O que você procura?</h2>
        <div className="search-fields">
          <label className="filter-field"><span>FINALIDADE</span>
            <select value={purpose} onChange={(event) => setPurpose(event.target.value as Purpose)}>
              <option value="todos">Comprar ou alugar</option><option value="venda">Comprar</option><option value="aluguel">Alugar</option>
            </select>
          </label>
          <label className="filter-field"><span>TIPO DE IMÓVEL</span>
            <select value={propertyType} onChange={(event) => setPropertyType(event.target.value)}>
              <option value="">Todos os tipos</option>{types.map((type) => <option key={type} value={type}>{type}</option>)}
            </select>
          </label>
          <label className="filter-field"><span>LOCALIZAÇÃO</span>
            <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Cidade ou bairro" />
          </label>
          <label className="filter-field"><span>FAIXA DE PREÇO</span>
            <select value={maxPrice} onChange={(event) => setMaxPrice(event.target.value)}>
              <option value="">Qualquer valor</option>{[2000, 5000, 10000, 300000, 500000, 1000000].map((amount) => <option key={amount} value={amount}>Até {formatCurrency(amount)}</option>)}
            </select>
          </label>
          <button className="primary-button" type="submit">Buscar imóveis <Icon name="arrow" size={16} /></button>
        </div>
      </form>

      <section className="listing-section page-shell" id="imoveis" aria-labelledby="listing-title">
        <div className="section-heading">
          <div>
            <p className="eyebrow section-eyebrow">SELEÇÃO ESPECIAL</p>
            <h2 id="listing-title">{showAll ? "Encontre seu imóvel" : "Imóveis em destaque"}</h2>
            <p className="section-description">Oportunidades escolhidas para você encontrar o lugar ideal.</p>
          </div>
          <button className="text-button" type="button" onClick={() => {
            setShowAll(true); setPurpose("todos"); setSearch(""); setPropertyType(""); setMaxPrice("");
            setFilters({purpose:"todos", search:"", propertyType:"", maxPrice:""});
          }}>Ver todos os imóveis <Icon name="arrow" size={16} /></button>
        </div>
        {showAll && !loading && !propertiesError && <p className="results-count" role="status">{visibleProperties.length} {visibleProperties.length === 1 ? "imóvel encontrado" : "imóveis encontrados"}</p>}

        {photosError && <p className="inline-notice" role="status">{photosError}</p>}

        {loading ? (<div className="state-panel" role="status"><span className="loading-spinner" />Carregando imóveis...</div>) : propertiesError ? (
          <div className="state-panel error-panel" role="alert">
            <span className="state-icon">!</span>
            <h3>Não conseguimos carregar os imóveis</h3>
            <p>{propertiesError}</p>
            <button className="retry-button" onClick={() => window.location.reload()} type="button">
              Tentar novamente
            </button>
          </div>
        ) : visibleProperties.length === 0 ? (
          <div className="state-panel">
            <span className="state-icon"><Icon name="search" size={22} /></span>
            <h3>{availableProperties.length ? "Nenhum imóvel encontrado" : "Novos imóveis em breve"}</h3>
            <p>
              {availableProperties.length
                ? "Experimente outra busca ou selecione uma finalidade diferente."
                : "No momento, não há imóveis disponíveis para venda ou locação."}
            </p>
          </div>
        ) : (
          <div className="property-grid">
            {displayedProperties.map((property) => {
              const propertyPurpose = purposeOf(property);
              const hasSalePrice = hasPrice(property.precoVenda);
              const hasRentalPrice = hasPrice(property.precoAluguel);
              const hasBothPurposes = propertyPurpose == null && hasSalePrice && hasRentalPrice;
              const picture = imageUrl(property);
              const location = [property.bairro?.nome, property.bairro?.cidade]
                .filter(Boolean)
                .join(", ");
              const area = formatArea(property.areaTotal);

              return (
                <article className="property-card" key={property.id}>
                  <button
                    className="card-image-button"
                    onClick={() => setSelectedProperty(property)}
                    type="button"
                    aria-label={`Ver detalhes de ${property.titulo ?? `imóvel ${property.id}`}`}
                  >
                    <div className="card-image">
                      <PropertyImage
                        alt={property.titulo ?? `Imóvel ${property.id}`}
                        src={picture}
                      />
                      <span className="purpose-badge">
                        {hasBothPurposes ? "VENDA E LOCAÇÃO" : propertyPurpose === "aluguel" ? "PARA ALUGAR" : propertyPurpose === "venda" ? "À VENDA" : "DISPONÍVEL"}
                      </span>
                      {property.destaque && <span className="featured-badge">DESTAQUE</span>}
                    </div>
                  </button>
                  <div className="card-content">
                    <div className="card-category-row">
                      <span>{property.tipoImovel?.nome ?? "Imóvel"}</span>
                      <span className="property-code">CÓD. {property.id.toString().padStart(4, "0")}</span>
                    </div>
                    <h3>{property.titulo || `${property.tipoImovel?.nome ?? "Imóvel"} disponível`}</h3>
                    <p className="card-location"><Icon name="pin" size={15} />{location || "Localização não informada"}</p>
                    <div className="card-features">
                      <span><Icon name="bed" size={17} />{property.dormitorios ?? "—"} <small>quartos</small></span>
                      <span><Icon name="bath" size={17} />{property.banheiros ?? "—"} <small>banhos</small></span>
                      <span><Icon name="car" size={17} />{property.garagem ?? "—"} <small>vagas</small></span>
                      {area && <span className="feature-area">{area}</span>}
                    </div>
                    <div className="card-footer">
                      {hasBothPurposes ? (
                        <div className="price-pair">
                          <div>
                            <span className="price-label">VENDA</span>
                            <p className="property-price">{formatCurrency(property.precoVenda)}</p>
                          </div>
                          <div>
                            <span className="price-label">ALUGUEL</span>
                            <p className="property-price">{formatCurrency(property.precoAluguel)}<span>/mês</span></p>
                          </div>
                        </div>
                      ) : (
                        <div>
                          <span className="price-label">{propertyPurpose === "aluguel" ? "ALUGUEL" : "VALOR DO IMÓVEL"}</span>
                          <p className="property-price">
                            {formatCurrency(amountOf(property, propertyPurpose ?? "todos"))}
                            {propertyPurpose === "aluguel" && <span>/mês</span>}
                          </p>
                        </div>
                      )}
                      <button
                        className="details-button"
                        onClick={() => setSelectedProperty(property)}
                        type="button"
                        aria-label={`Ver detalhes do imóvel ${property.id}`}
                      >
                        Ver detalhes <Icon name="arrow" size={14} />
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      <section className="benefits page-shell" id="sobre" aria-label="Por que escolher a JG Imóveis">
        <div><span>01</span><h2>Curadoria de verdade</h2><p>Opções selecionadas com cuidado.</p></div>
        <div><span>02</span><h2>Atendimento próximo</h2><p>Especialistas em cada etapa.</p></div>
        <div><span>03</span><h2>Negociação segura</h2><p>Confiança para a sua escolha.</p></div>
      </section>

      <footer className="site-footer" id="contato">
        <div className="page-shell footer-inner">
          <div>
            <a className="brand" href="#inicio" aria-label="JG Imóveis, página inicial"><Image src="/images/logo-jg.png" alt="JG Imóveis" width={1536} height={1024} unoptimized /></a>
            <p>Encontramos espaços. Você constrói histórias.</p>
          </div>
          <div className="footer-contact"><h2>Entre em contato</h2>
            <p><a href="tel:+5555991975907">(55) 99197-5907</a><span> · </span><a href="mailto:joaopatrao@jgimoveis.com.br">joaopatrao@jgimoveis.com.br</a></p>
            <small>Projeto acadêmico · JG Imóveis</small>
          </div>
        </div>
      </footer>

      <dialog ref={loginDialog} className="login-dialog" aria-labelledby="login-title" onClose={() => setLoginOpen(false)} onClick={(event) => { if(event.target === event.currentTarget) setLoginOpen(false); }}>
        <button className="modal-close" type="button" aria-label="Fechar login" onClick={() => setLoginOpen(false)}><Icon name="close" /></button>
        <p className="eyebrow section-eyebrow">BEM-VINDO À JG IMÓVEIS</p><h2 id="login-title">Entre na sua conta</h2>
        <form onSubmit={async (event) => {
          event.preventDefault();
          const data = new FormData(event.currentTarget);
          setLoginBusy(true); setLoginMessage("");
          try {
            const response = await fetch(apiUrl + "/auth/login", {method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({email:data.get("email"), senha:data.get("senha")})});
            if(!response.ok) { setLoginMessage(response.status === 401 ? "E-mail ou senha inválidos." : "Não foi possível entrar. Tente novamente."); return; }
            const result = await response.json();
            if(typeof result.token !== "string" || !result.token) throw new Error("Resposta inválida");
            sessionStorage.setItem("jg-token", result.token);
            setLoginMessage("Login realizado com sucesso.");
          } catch { setLoginMessage("Não foi possível conectar. Tente novamente."); }
          finally { setLoginBusy(false); }
        }}>
          <label>E-mail<input name="email" type="email" autoComplete="username" required placeholder="seu@email.com" /></label>
          <label>Senha<input name="senha" type="password" autoComplete="current-password" required placeholder="Sua senha" /></label>
          <button className="primary-button" type="submit" disabled={loginBusy}>{loginBusy ? "Entrando..." : "Entrar"}<Icon name="arrow" size={16} /></button>
          {loginMessage && <p role="status">{loginMessage}</p>}
        </form>
      </dialog>

      {selectedProperty && (
        <dialog ref={detailDialog} onClose={() => setSelectedProperty(null)} onClick={(event) => { if(event.target === event.currentTarget) setSelectedProperty(null); }}
            aria-labelledby="modal-title"
            aria-modal="true"
            className="property-modal"
            role="dialog"
          >
            <button
              aria-label="Fechar detalhes"
              className="modal-close"
              onClick={() => setSelectedProperty(null)}
              type="button"
            >
              <Icon name="close" />
            </button>
            {imageUrl(selectedProperty) && (
              <div className="modal-image">
                <PropertyImage
                  alt={selectedProperty.titulo ?? `Imóvel ${selectedProperty.id}`}
                  src={imageUrl(selectedProperty)}
                />
              </div>
            )}
            <div className="modal-content">
              <p className="eyebrow section-eyebrow">
                {selectedHasBothPurposes ? "VENDA E LOCAÇÃO" : selectedPurpose === "aluguel" ? "PARA ALUGAR" : "À VENDA"} · CÓD. {selectedProperty.id.toString().padStart(4, "0")}
              </p>
              <h2 id="modal-title">{selectedProperty.titulo || `${selectedProperty.tipoImovel?.nome ?? "Imóvel"} disponível`}</h2>
              <p className="card-location"><Icon name="pin" size={16} />
                {[selectedProperty.endereco, selectedProperty.numero, selectedProperty.bairro?.nome, selectedProperty.bairro?.cidade]
                  .filter(Boolean).join(", ") || "Localização não informada"}
              </p>
              {selectedHasBothPurposes ? (
                <div className="modal-price-pair">
                  <p className="modal-price">{formatCurrency(selectedProperty.precoVenda)}<span>à venda</span></p>
                  <p className="modal-price">{formatCurrency(selectedProperty.precoAluguel)}<span>/mês para locação</span></p>
                </div>
              ) : (
                <p className="modal-price">{formatCurrency(amountOf(selectedProperty, selectedPurpose ?? "todos"))}
                  {selectedPurpose === "aluguel" && <span>/mês</span>}
                </p>
              )}
              <div className="modal-features">
                <span><Icon name="bed" />{selectedProperty.dormitorios ?? "—"} quartos</span>
                <span><Icon name="bath" />{selectedProperty.banheiros ?? "—"} banheiros</span>
                <span><Icon name="car" />{selectedProperty.garagem ?? "—"} vagas</span>
                {formatArea(selectedProperty.areaTotal) && <span>{formatArea(selectedProperty.areaTotal)}</span>}
              </div>
              <p className="modal-description">{selectedProperty.descricao || "Mais informações sobre este imóvel em breve."}</p>
            </div>
          </dialog>
      )}
    </main>
  );
}
