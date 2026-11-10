"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { API_URL, useAuth } from "../../auth/AuthProvider";
import PropertyImage from "../PropertyImage";
import PropertyForm from "./PropertyForm";
import LookupDialog from "./LookupDialog";
import { DeletePropertyDialog } from "./PropertyPhotos";
import { createdId, friendlyError, money, normalize, STATUS_LABELS, type AdminPhoto, type AdminProperty, type Bairro, type Tipo, type LookupKind, type PropertyPayload } from "./types";

type Lookup = { kind: LookupKind; select: (id: number) => void };
export default function AdminDashboard() {
  const { user, request, logout } = useAuth();
  const [properties, setProperties] = useState<AdminProperty[]>([]);
  const [photos, setPhotos] = useState<AdminPhoto[]>([]);
  const [bairros, setBairros] = useState<Bairro[]>([]);
  const [tipos, setTipos] = useState<Tipo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState<{ text: string; warning: boolean } | null>(null);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [editor, setEditor] = useState<{ property: AdminProperty | null; photos: boolean } | null>(null);
  const [deleting, setDeleting] = useState<AdminProperty | null>(null);
  const [lookup, setLookup] = useState<Lookup | null>(null);

  const readList = useCallback(async <T,>(path: string, signal?: AbortSignal): Promise<T[]> => {
    const response = await request(path, { signal });
    const data: unknown = await response.json().catch(() => null);
    if (!Array.isArray(data)) throw new Error("A lista não pôde ser carregada. Tente novamente.");
    return data as T[];
  }, [request]);
  const reload = useCallback(async (signal?: AbortSignal) => {
    const [items, pictures, neighborhoods, types] = await Promise.all([
      readList<AdminProperty>("/imoveis", signal), readList<AdminPhoto>("/fotos/vitrine", signal),
      readList<Bairro>("/bairros", signal), readList<Tipo>("/tipos_imoveis", signal)
    ]);
    if (signal?.aborted) return;
    setProperties(items); setPhotos(pictures); setBairros(neighborhoods); setTipos(types);
  }, [readList]);
  useEffect(() => {
    const controller = new AbortController();
    async function load() { try { await reload(controller.signal); } catch (failure) { if (!controller.signal.aborted) setError(friendlyError(failure)); } finally { if (!controller.signal.aborted) setLoading(false); } }
    void load(); return () => controller.abort();
  }, [reload]);
  const filtered = useMemo(() => properties.filter((property) => (!status || normalize(property.status) === status) && normalize([property.id, property.titulo, property.bairro?.nome, property.bairro?.cidade, property.tipoImovel?.nome].join(" ")).includes(normalize(search))), [properties, search, status]);

  async function save(body: PropertyPayload, files: File[]) {
    const existingId = editor?.property?.id;
    const response = await request(existingId ? `/imoveis/${existingId}` : "/imoveis", { method: existingId ? "PUT" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    const id = existingId || createdId(response);
    const pictures = photos.filter((photo) => photo.imovelId === id);
    let hasCover = pictures.some((photo) => photo.capa);
    let failed = 0;
    for (const file of files) {
      try {
        const data = new FormData(); data.set("arquivo", file); data.set("imovelId", String(id));
        const photo = await (await request("/fotos", { method: "POST", body: data })).json();
        if (!hasCover) { await request(`/fotos/${photo.id}/capa`, { method: "PATCH" }); hasCover = true; }
      } catch { failed++; }
    }
    let refreshFailed = false;
    try { await reload(); } catch { refreshFailed = true; }
    setEditor(null);
    setNotice({ warning: failed > 0 || refreshFailed, text: failed ? `Imóvel salvo, mas ${failed} foto(s) não puderam ser enviadas ou definidas como capa. Abra Editar / Fotos para conferir e tentar novamente.` : refreshFailed ? "Imóvel salvo. Não foi possível atualizar a lista; recarregue a página para conferir." : existingId ? "Imóvel atualizado com sucesso." : "Novo imóvel cadastrado com sucesso." });
  }

  return <main className="admin-page">
    <header className="site-header"><div className="page-shell header-inner">
      <Link className="brand" href="/" aria-label="JG Imóveis, vitrine pública"><Image src="/images/logo-jg.png" alt="JG Imóveis" width={1536} height={1024} unoptimized priority /></Link>
      <span className="admin-header-label">PAINEL ADMINISTRATIVO</span><div className="account-menu"><span className="account-link">{user?.nome}</span><button className="primary-button login-button" type="button" onClick={logout}>Sair</button></div>
    </div></header>
    <div className="page-shell admin-main">
      <div className="admin-page-heading"><div><p className="eyebrow section-eyebrow">GERENCIAR ANÚNCIOS</p><h1>Seus imóveis, sob controle.</h1><p>Cadastre, atualize e organize os imóveis da JG Imóveis.</p></div><div className="admin-heading-actions"><Link className="text-button" href="/">Ver vitrine pública ↗</Link><button className="primary-button" type="button" onClick={() => { setNotice(null); setEditor({ property: null, photos: false }); }} disabled={loading || Boolean(error)}>＋ Adicionar novo imóvel</button></div></div>
      <div className="admin-stats" aria-label="Resumo dos imóveis">
        {[["Imóveis cadastrados", properties.length], ["Disponíveis", properties.filter((property) => normalize(property.status) === "disponivel").length], ["Reservados", properties.filter((property) => normalize(property.status) === "reservado").length], ["Em destaque", properties.filter((property) => property.destaque).length]].map(([label, value]) => <div key={label}><span>{label}</span><strong>{loading ? "—" : value}</strong></div>)}
      </div>
      {notice && <div className={notice.warning ? "admin-notice is-warning" : "admin-notice"} role="status"><span>{notice.text}</span><button aria-label="Fechar mensagem" type="button" onClick={() => setNotice(null)}>×</button></div>}
      <section className="admin-inventory" aria-labelledby="inventory-title">
        <div className="admin-inventory-heading"><div><h2 id="inventory-title">Imóveis cadastrados</h2><p>{filtered.length} {filtered.length === 1 ? "imóvel na lista" : "imóveis na lista"}</p></div><div className="admin-filters"><label><span className="admin-sr-only">Buscar imóveis</span><input type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar por título, bairro ou código" /></label><label><span className="admin-sr-only">Filtrar situação</span><select value={status} onChange={(event) => setStatus(event.target.value)}><option value="">Todas as situações</option>{Object.entries(STATUS_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label></div></div>
        {loading ? <div className="state-panel" role="status"><span className="loading-spinner" />Carregando imóveis...</div>
          : error ? <div className="state-panel" role="alert"><h3>Não conseguimos carregar seus imóveis</h3><p>{error}</p><button type="button" className="primary-button" onClick={async () => { setLoading(true); setError(""); try { await reload(); } catch (failure) { setError(friendlyError(failure)); } finally { setLoading(false); } }}>Tentar novamente</button></div>
          : filtered.length === 0 ? <div className="state-panel"><h3>{properties.length ? "Nenhum imóvel encontrado" : "Seu primeiro imóvel começa aqui"}</h3><p>{properties.length ? "Experimente outro termo ou outra situação." : "Clique em Adicionar novo imóvel para criar um anúncio."}</p></div>
          : <div className="admin-property-list">{filtered.map((property) => {
            const picture = photos.filter((photo) => photo.imovelId === property.id).sort((a, b) => Number(Boolean(b.capa)) - Number(Boolean(a.capa)) || (a.ordem ?? 999999) - (b.ordem ?? 999999))[0];
            return <article className="admin-property-card" key={property.id} data-property-id={property.id}>
              <div className="admin-property-image"><PropertyImage src={picture ? `${API_URL}/fotos/${property.id}/${encodeURIComponent(picture.nomeArquivo)}` : null} alt={property.titulo || "Imóvel"} />{property.destaque && <span className="admin-featured">Em destaque</span>}</div>
              <div className="admin-property-info"><div className="admin-card-top"><span className="admin-property-code">CÓD. {String(property.id).padStart(4, "0")}</span><span className={`admin-status status-${normalize(property.status)}`}>{STATUS_LABELS[normalize(property.status)] || property.status || "Não informado"}</span></div><h3>{property.titulo || "Imóvel sem título"}</h3><p className="admin-property-location">{[property.bairro?.nome, property.bairro?.cidade, property.bairro?.estado].filter(Boolean).join(" · ") || "Localização não informada"}</p><p className="admin-property-features">{property.tipoImovel?.nome || "Imóvel"} · {property.dormitorios ?? 0} quartos · {property.banheiros ?? 0} banheiros · {property.garagem ?? 0} vagas{property.areaTotal ? ` · ${property.areaTotal} m²` : ""}</p><div className="admin-prices">{Number(property.precoVenda) > 0 && <div><span>Venda</span><strong>{money(property.precoVenda)}</strong></div>}{Number(property.precoAluguel) > 0 && <div><span>Aluguel mensal</span><strong>{money(property.precoAluguel)}</strong></div>}</div></div>
              <div className="admin-card-actions"><button className="secondary-button" type="button" onClick={() => setEditor({ property, photos: false })}>Editar imóvel</button><button className="admin-quiet-button" type="button" onClick={() => setEditor({ property, photos: true })}>Fotos ({photos.filter((photo) => photo.imovelId === property.id).length})</button><button className="admin-danger-link" type="button" onClick={() => setDeleting(property)}>Excluir imóvel</button></div>
            </article>;
          })}</div>}
      </section>
    </div>
    {editor && <PropertyForm key={editor.property?.id || "novo"} property={editor.property} focusPhotos={editor.photos} bairros={bairros} tipos={tipos} photos={photos.filter((photo) => photo.imovelId === editor.property?.id)} onClose={() => setEditor(null)} onSave={save} onPhotosChange={() => reload()} onNewLookup={(kind, select) => setLookup({ kind, select })} />}
    {lookup && <LookupDialog kind={lookup.kind} onClose={() => setLookup(null)} onSave={async (body) => { const route = lookup.kind === "bairro" ? "/bairros" : "/tipos_imoveis"; const id = createdId(await request(route, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) })); await reload(); lookup.select(id); setLookup(null); }} />}
    {deleting && <DeletePropertyDialog title={deleting.titulo || `Imóvel #${deleting.id}`} onClose={() => setDeleting(null)} onConfirm={async () => { await request(`/imoveis/${deleting.id}`, { method: "DELETE" }); setProperties((current) => current.filter((property) => property.id !== deleting.id)); setPhotos((current) => current.filter((photo) => photo.imovelId !== deleting.id)); setDeleting(null); setNotice({ text: "Imóvel excluído com sucesso.", warning: false }); }} />}
  </main>;
}
