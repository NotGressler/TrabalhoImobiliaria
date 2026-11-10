"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import { homeFor, useAuth } from "../auth/AuthProvider";
import PropertyImage from "../components/PropertyImage";
import useFavorites from "../hooks/useFavorites";

import { normalize, purposeOf, hasPrice, supportsPurpose, amountOf, formatCurrency, formatArea, Icon, photosFor, type Property, type PropertyPhoto, type Purpose } from "../lib/property";
export type { Property, PropertyPhoto } from "../lib/property";

type Props = {
  properties: Property[];
  photos: PropertyPhoto[];
  apiUrl: string;
  propertiesError: string | null;
  photosError: string | null;
  loading?: boolean;
  clientArea?: boolean;
};

export default function PropertyShowcase({
  properties,
  photos,
  apiUrl,
  propertiesError,
  photosError,
  loading = false,
  clientArea = false,
}: Props) {
  const { user, status, logout } = useAuth();
  const favorites = useFavorites(clientArea && user?.tipo === "USER");
  const [purpose, setPurpose] = useState<Purpose>("todos");
  const [search, setSearch] = useState("");
  const [propertyType, setPropertyType] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [filters, setFilters] = useState({ purpose: "todos" as Purpose, search: "", propertyType: "", maxPrice: "" });
  const [page, setPage] = useState(1);
  const [priceOrder, setPriceOrder] = useState("destaques");

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
  const orderedProperties = useMemo(() => [...visibleProperties].sort((a, b) => {
    if (priceOrder === "destaques") return Number(Boolean(b.destaque)) - Number(Boolean(a.destaque)) || a.id - b.id;
    const aPrice = amountOf(a, filters.purpose);
    const bPrice = amountOf(b, filters.purpose);
    if (!hasPrice(aPrice)) return hasPrice(bPrice) ? 1 : a.id - b.id;
    if (!hasPrice(bPrice)) return -1;
    return (Number(aPrice) - Number(bPrice)) * (priceOrder === "menor" ? 1 : -1) || a.id - b.id;
  }), [visibleProperties, priceOrder, filters.purpose]);
  const totalPages = Math.max(1, Math.ceil(orderedProperties.length / 6));
  const currentPage = Math.min(page, totalPages);
  const startIndex = (currentPage - 1) * 6;
  const displayedProperties = orderedProperties.slice(startIndex, startIndex + 6);
  function changePage(next: number) {
    setPage(Math.max(1, Math.min(next, totalPages)));
    document.getElementById("imoveis")?.scrollIntoView({ block: "start" });
  }

  const imageUrl = (property: Property) => {
    const photo = photosFor(property.id, photos)[0];
    if (!photo?.nomeArquivo) return null;
    return `${apiUrl}/fotos/${property.id}/${encodeURIComponent(photo.nomeArquivo)}`;
  };

  const favoriteProperties = favorites.ids.map((id) => properties.find((property) => property.id === id)).filter((property): property is Property => Boolean(property));
  const renderPropertyCard = (property: Property) => {
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
      <article className="property-card" key={property.id} data-property-id={property.id}>
        <a
          className="card-image-button"
          href={`/imovel/?id=${property.id}${clientArea ? "&origem=cliente" : ""}`}
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
            {clientArea && favorites.ids.includes(property.id) ? <span className="featured-badge saved-badge">♥ FAVORITO</span> : property.destaque && <span className="featured-badge">DESTAQUE</span>}
          </div>
        </a>
        <div className="card-content">
          <div className="card-category-row">
            <span>{property.tipoImovel?.nome ?? "Imóvel"}</span>
            <span className="property-code">CÓD. {property.id.toString().padStart(4, "0")}</span>
          </div>
          {normalize(property.status) !== "disponivel" && <p className="saved-property-status">{property.status || "Indisponível"}</p>}
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
            <a
              className="details-button"
              href={`/imovel/?id=${property.id}${clientArea ? "&origem=cliente" : ""}`}
              aria-label={`Ver detalhes do imóvel ${property.id}`}
            >
              Ver detalhes <Icon name="arrow" size={14} />
            </a>
          </div>
        </div>
      </article>
    );

  };

  return (
    <main>
      <header className="site-header">
        <div className="page-shell header-inner">
          <a className="brand" href="#inicio" aria-label="JG Imóveis, página inicial">
            <Image src="/images/logo-jg.png" alt="JG Imóveis" width={1536} height={1024} unoptimized priority />
          </a>
          <nav className="main-nav" aria-label="Navegação principal">
            <a href="#imoveis" onClick={() => { setPurpose("venda"); setSearch(""); setPropertyType(""); setMaxPrice(""); setFilters({purpose:"venda", search:"", propertyType:"", maxPrice:""}); setPage(1); }}>Comprar</a>
            <a href="#imoveis" onClick={() => { setPurpose("aluguel"); setSearch(""); setPropertyType(""); setMaxPrice(""); setFilters({purpose:"aluguel", search:"", propertyType:"", maxPrice:""}); setPage(1); }}>Alugar</a>
            <a href="#sobre">Sobre nós</a>
            <a href="#contato">Contato</a>
          </nav>
          <div className="account-menu">
            {status === "authenticated" && user ? <>
              <a className="account-link" href={homeFor(user)}>{clientArea ? user.nome : user.tipo === "ADMIN" ? "Área do admin" : "Minha área"}</a>
              <button className="primary-button login-button" onClick={logout} type="button">Sair</button>
            </> : <a className="primary-button login-button" href="/entrar/">Fazer login</a>}
          </div>
        </div>
      </header>

      {clientArea && user && <section className="client-banner"><div className="page-shell"><span>ÁREA DO CLIENTE</span><p>Olá, {user.nome}! Encontre o imóvel que combina com você.</p></div></section>}

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
        setPage(1);
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

      {clientArea && user?.tipo === "USER" && <section className="favorites-section page-shell" id="favoritos" aria-labelledby="favorites-title">
        <div className="section-heading"><div><p className="eyebrow section-eyebrow">ESCOLHIDOS POR VOCÊ</p><h2 id="favorites-title">Meus favoritos</h2><p className="section-description">Seus imóveis preferidos, reunidos em um só lugar.</p></div><span className="favorites-count">{favoriteProperties.length} {favoriteProperties.length === 1 ? "imóvel" : "imóveis"}</span></div>
        {favorites.loading || loading ? <div className="favorites-empty" role="status">Carregando seus favoritos...</div>
          : favorites.error || propertiesError ? <div className="favorites-empty" role="alert"><p>{favorites.error || "Não foi possível carregar os imóveis favoritos."}</p><button className="text-button" type="button" onClick={() => propertiesError ? window.location.reload() : favorites.retry()}>Tentar novamente</button></div>
          : favoriteProperties.length ? <div className="property-grid">{favoriteProperties.map(renderPropertyCard)}</div>
          : <div className="favorites-empty"><span aria-hidden="true">♡</span><p>Você ainda não tem favoritos. Abra um imóvel e clique em <strong>Favoritar imóvel</strong> para salvá-lo aqui.</p></div>}
      </section>}

      <section className="listing-section page-shell" id="imoveis" aria-labelledby="listing-title">
        <div className="section-heading">
          <div>
            <p className="eyebrow section-eyebrow">SELEÇÃO ESPECIAL</p>
            <h2 id="listing-title">Encontre seu imóvel</h2>
            <p className="section-description">Oportunidades escolhidas para você encontrar o lugar ideal.</p>
          </div>
          <div className="listing-actions">
          <label className="listing-sort">Ordenar por
            <select value={priceOrder} onChange={(event) => { setPriceOrder(event.target.value); setPage(1); }}>
              <option value="destaques">Destaques primeiro</option>
              <option value="menor">Menor preço</option>
              <option value="maior">Maior preço</option>
            </select>
          </label>
          <button className="text-button" type="button" onClick={() => {
            setPage(1); setPurpose("todos"); setSearch(""); setPropertyType(""); setMaxPrice("");
            setFilters({purpose:"todos", search:"", propertyType:"", maxPrice:""});
          }}>Ver todos os imóveis <Icon name="arrow" size={16} /></button>
          </div>
        </div>
        {priceOrder !== "destaques" && filters.purpose === "todos" && <p className="sort-note">Para imóveis com venda e aluguel, a ordenação considera o valor de venda. Selecione “Alugar” para comparar os aluguéis.</p>}
        {!loading && !propertiesError && <p className="results-count" role="status">{visibleProperties.length ? `Exibindo ${startIndex + 1}–${Math.min(startIndex + 6, visibleProperties.length)} de ${visibleProperties.length} imóveis` : "Nenhum imóvel encontrado"}</p>}

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
            {displayedProperties.map(renderPropertyCard)}
          </div>
        )}
        {!loading && !propertiesError && totalPages > 1 && <nav className="listing-pagination" aria-label="Páginas de imóveis">
          <button type="button" disabled={currentPage === 1} onClick={() => changePage(currentPage - 1)}>← Anterior</button>
          {Array.from({ length: totalPages }, (_, index) => index + 1).filter((number) => number === 1 || number === totalPages || Math.abs(number - currentPage) <= 1).map((number, index, pages) => <span className="pagination-item" key={number}>
            {index > 0 && number - pages[index - 1] > 1 && <span className="pagination-gap" aria-hidden="true">…</span>}
            <button type="button" aria-label={`Página ${number}`} aria-current={number === currentPage ? "page" : undefined} onClick={() => changePage(number)}>{number}</button>
          </span>)}
          <button type="button" disabled={currentPage === totalPages} onClick={() => changePage(currentPage + 1)}>Próxima →</button>
        </nav>}
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
            <small>Projeto acadêmico · Gremio maior do sul</small>
          </div>
        </div>
      </footer>

    </main>
  );
}
