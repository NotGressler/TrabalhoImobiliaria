"use client";

import { useMemo, useState } from "react";

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
    // eslint-disable-next-line @next/next/no-img-element -- The backend origin is configurable through API_URL.
    <img className="property-image" src={src} alt={alt} onError={() => setFailed(true)} />
  );
}

export default function PropertyShowcase({
  properties,
  photos,
  apiUrl,
  propertiesError,
  photosError,
}: Props) {
  const [purpose, setPurpose] = useState<Purpose>("todos");
  const [search, setSearch] = useState("");
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);

  const availableProperties = useMemo(
    () => properties.filter((property) => normalize(property.status) === "disponivel"),
    [properties],
  );

  const visibleProperties = useMemo(() => {
    const query = normalize(search);
    return availableProperties
      .filter((property) => purpose === "todos" || supportsPurpose(property, purpose))
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
  }, [availableProperties, purpose, search]);

  const tabs: { value: Purpose; label: string; count: number }[] = [
    { value: "todos", label: "Todos os imóveis", count: availableProperties.length },
    {
      value: "venda",
      label: "Comprar",
      count: availableProperties.filter((property) => supportsPurpose(property, "venda")).length,
    },
    {
      value: "aluguel",
      label: "Alugar",
      count: availableProperties.filter((property) => supportsPurpose(property, "aluguel")).length,
    },
  ];

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
      <div className="topline">
        <div className="page-shell topline-inner">
          <span>Um lugar para chamar de seu.</span>
          <span>Encontre seu próximo endereço</span>
        </div>
      </div>

      <header className="site-header page-shell">
        <a className="brand" href="#" aria-label="Morada, página inicial">
          <span className="brand-mark" aria-hidden="true">m.</span>
          <span>morada<span className="brand-period">.</span></span>
        </a>
        <nav className="main-nav" aria-label="Navegação principal">
          <a className="nav-active" href="#imoveis">Imóveis</a>
          <a href="#sobre">Sobre nós</a>
        </nav>
        <a className="header-cta" href="#imoveis">
          Encontrar meu imóvel <Icon name="arrow" size={16} />
        </a>
      </header>

      <section className="hero">
        <div className="hero-grain" />
        <div className="hero-content page-shell">
          <div className="hero-copy">
            <p className="eyebrow"><span /> SEU NOVO CAPÍTULO COMEÇA AQUI</p>
            <h1>Mais que um imóvel.<br /><em>Um novo jeito de viver.</em></h1>
            <p className="hero-description">
              Espaços escolhidos para combinar com a vida que você quer construir.
            </p>
            <a className="hero-link" href="#imoveis">
              Descubra seu próximo lar <Icon name="arrow" size={17} />
            </a>
          </div>
          <div className="hero-art" aria-hidden="true">
            <div className="hero-sun" />
            <div className="hero-building building-back">
              <span className="window window-one" /><span className="window window-two" />
              <span className="window window-three" /><span className="window window-four" />
            </div>
            <div className="hero-building building-front">
              <span className="window window-one" /><span className="window window-two" />
              <span className="window window-three" /><span className="door" />
            </div>
            <div className="hero-ground" />
            <span className="art-caption">ESPAÇO PARA VIVER BEM</span>
          </div>
          <div className="hero-index"><span>01</span><i /> UM LAR, MUITAS POSSIBILIDADES</div>
        </div>
      </section>

      <section className="listing-section page-shell" id="imoveis">
        <div className="section-heading">
          <div>
            <p className="eyebrow section-eyebrow">SELEÇÃO MORADA</p>
            <h2>Encontre o seu lugar.</h2>
            <p className="section-description">Imóveis que têm tudo a ver com a próxima fase da sua vida.</p>
          </div>
          <div className="listing-count">
            <span className="count-number">{availableProperties.length.toString().padStart(2, "0")}</span>
            <span>imóveis<br />disponíveis</span>
          </div>
        </div>

        <div className="listing-toolbar">
          <div className="purpose-tabs" role="tablist" aria-label="Finalidade do imóvel">
            {tabs.map((tab) => (
              <button
                className={`purpose-tab ${purpose === tab.value ? "selected" : ""}`}
                key={tab.value}
                onClick={() => setPurpose(tab.value)}
                role="tab"
                aria-selected={purpose === tab.value}
                type="button"
              >
                {tab.label}<span>{tab.count}</span>
              </button>
            ))}
          </div>
          <label className="search-field">
            <Icon name="search" size={19} />
            <input
              aria-label="Buscar por bairro, cidade ou tipo de imóvel"
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Bairro, cidade ou tipo"
              value={search}
            />
            <span className="search-shortcut">⌕</span>
          </label>
        </div>

        {photosError && <p className="inline-notice" role="status">{photosError}</p>}

        {propertiesError ? (
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
            {visibleProperties.map((property) => {
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
                        <Icon name="arrow" size={19} />
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      <section className="closing-band" id="sobre">
        <div className="page-shell closing-inner">
          <span className="closing-mark">m.</span>
          <p>Seu próximo capítulo<br /><em>merece um bom começo.</em></p>
          <a href="#imoveis">Explorar imóveis <Icon name="arrow" size={17} /></a>
        </div>
      </section>

      <footer className="site-footer page-shell">
        <a className="brand footer-brand" href="#" aria-label="Morada, página inicial">
          <span className="brand-mark" aria-hidden="true">m.</span>
          <span>morada<span className="brand-period">.</span></span>
        </a>
        <span>Um lugar para cada história.</span>
        <span>© {new Date().getFullYear()} Morada Imóveis</span>
      </footer>

      {selectedProperty && (
        <div className="modal-backdrop" onClick={() => setSelectedProperty(null)} role="presentation">
          <section
            aria-labelledby="modal-title"
            aria-modal="true"
            className="property-modal"
            onClick={(event) => event.stopPropagation()}
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
          </section>
        </div>
      )}
    </main>
  );
}
