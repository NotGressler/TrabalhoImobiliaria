"use client";

import { useEffect, useRef, useState } from "react";
import PropertyPhotos from "./PropertyPhotos";
import { friendlyError, normalize, purpose, STATUS_LABELS, type AdminPhoto, type AdminProperty, type Bairro, type Tipo, type LookupKind, type PropertyPayload } from "./types";

type Props = {
  property: AdminProperty | null; bairros: Bairro[]; tipos: Tipo[]; photos: AdminPhoto[]; focusPhotos: boolean;
  onClose: () => void; onSave: (body: PropertyPayload, files: File[]) => Promise<void>;
  onPhotosChange: () => Promise<void>; onNewLookup: (kind: LookupKind, select: (id: number) => void) => void;
};

export default function PropertyForm({ property, bairros, tipos, photos, focusPhotos, onClose, onSave, onPhotosChange, onNewLookup }: Props) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [finalidade, setFinalidade] = useState(purpose(property));
  const [bairroId, setBairroId] = useState(String(property?.bairro?.id ?? ""));
  const [tipoId, setTipoId] = useState(String(property?.tipoImovel?.id ?? ""));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const selectedBairro = bairros.find((bairro) => String(bairro.id) === bairroId);
  useEffect(() => { dialog.current?.showModal(); if (focusPhotos) dialog.current?.querySelector('#property-photos')?.scrollIntoView({ block: "start" }); }, [focusPhotos]);

  return <dialog className="admin-editor-dialog" ref={dialog} aria-labelledby="editor-title" onCancel={(event) => { event.preventDefault(); if (!busy) onClose(); }}>
    <div className="admin-editor-heading"><div><p className="eyebrow section-eyebrow">CADASTRO DE IMÓVEIS</p><h2 id="editor-title">{property ? `Editar imóvel #${property.id}` : "Adicionar novo imóvel"}</h2><p>Preencha os dados do anúncio. Os campos com * são obrigatórios.</p></div><button className="admin-close-button" type="button" disabled={busy} onClick={onClose} aria-label="Fechar formulário">×</button></div>
    <form onSubmit={async (event) => {
      event.preventDefault();
      const data = new FormData(event.currentTarget);
      const text = (name: string) => String(data.get(name) ?? "").trim();
      const decimal = (name: string) => text(name) || null;
      const files = data.getAll("fotos").filter((entry): entry is File => entry instanceof File && Boolean(entry.name));
      if (files.length > 10) { setError("Selecione até 10 fotos de cada vez."); return; }
      if (files.some((file) => !["image/jpeg", "image/png", "image/webp"].includes(file.type) || file.size === 0 || file.size > 10 * 1024 * 1024)) { setError("Envie fotos JPG, PNG ou WebP de até 10 MB cada."); return; }
      if (!text("titulo") || !text("descricao") || !text("endereco") || !text("numero")) { setError("Preencha título, descrição, endereço e número do imóvel."); return; }
      if (text("areaConstruida") && Number(text("areaConstruida")) > Number(text("areaTotal"))) { setError("A área construída não pode ser maior que a área total."); return; }
      const body: PropertyPayload = {
        titulo: text("titulo"), descricao: text("descricao"), finalidade, status: text("status"),
        tipoImovel: { id: Number(tipoId) }, bairro: { id: Number(bairroId) },
        endereco: text("endereco"), numero: text("numero"), complemento: text("complemento"), cep: text("cep"),
        dormitorios: Number(text("dormitorios") || 0), banheiros: Number(text("banheiros") || 0), garagem: Number(text("garagem") || 0),
        areaTotal: decimal("areaTotal"), areaConstruida: decimal("areaConstruida"),
        precoVenda: finalidade.includes("venda") ? decimal("precoVenda") : null,
        precoAluguel: finalidade.includes("aluguel") ? decimal("precoAluguel") : null,
        caracteristicas: text("caracteristicas"), destaque: data.has("destaque")
      };
      setBusy(true); setError("");
      try { await onSave(body, files); }
      catch (failure) { setError(friendlyError(failure)); setBusy(false); }
    }}>
      <fieldset disabled={busy} className="admin-fieldset admin-editor-fields">
        <section className="admin-form-section"><h3>Informações do anúncio</h3><div className="admin-form-grid">
          <label className="admin-span-2">Título *<input name="titulo" required maxLength={150} defaultValue={property?.titulo ?? ""} placeholder="Ex.: Casa com piscina no Centro" /></label>
          <label>Tipo de imóvel *<select name="tipo" required value={tipoId} onChange={(event) => setTipoId(event.target.value)}><option value="">Selecione um tipo</option>{tipos.map((tipo) => <option key={tipo.id} value={tipo.id}>{tipo.nome}</option>)}</select><button className="admin-inline-link" type="button" onClick={() => onNewLookup("tipo", (id) => setTipoId(String(id)))}>+ Cadastrar novo tipo</button></label>
          <label>Situação *<select name="status" defaultValue={normalize(property?.status) || "disponivel"} required>{Object.entries(STATUS_LABELS).map(([value, title]) => <option key={value} value={value}>{title}</option>)}</select></label>
          <label>Finalidade *<select name="finalidade" value={finalidade} onChange={(event) => setFinalidade(event.target.value)}><option value="venda">Venda</option><option value="aluguel">Aluguel</option><option value="venda e aluguel">Venda e aluguel</option></select></label>
          {finalidade.includes("venda") && <label>Valor de venda (R$) *<input name="precoVenda" type="number" min="0.01" max="9999999999999.99" step="0.01" required defaultValue={property?.precoVenda ?? ""} placeholder="450000,00" /></label>}
          {finalidade.includes("aluguel") && <label>Aluguel por mês (R$) *<input name="precoAluguel" type="number" min="0.01" max="9999999999999.99" step="0.01" required defaultValue={property?.precoAluguel ?? ""} placeholder="2500,00" /></label>}
          <label className="admin-checkbox admin-span-2"><input name="destaque" type="checkbox" defaultChecked={Boolean(property?.destaque)} /><span>Exibir este imóvel em destaque na vitrine</span></label>
        </div></section>
        <section className="admin-form-section"><h3>Localização</h3><div className="admin-form-grid">
          <label className="admin-span-2">Bairro *<select name="bairro" required value={bairroId} onChange={(event) => setBairroId(event.target.value)}><option value="">Selecione um bairro</option>{bairros.map((bairro) => <option key={bairro.id} value={bairro.id}>{bairro.nome}{bairro.cidade ? ` · ${bairro.cidade}` : ""}{bairro.estado ? `/${bairro.estado}` : ""}</option>)}</select><button className="admin-inline-link" type="button" onClick={() => onNewLookup("bairro", (id) => setBairroId(String(id)))}>+ Cadastrar novo bairro</button></label>
          {selectedBairro && <p className="admin-help admin-span-2">Cidade: {selectedBairro.cidade || "Não informada"} · Estado: {selectedBairro.estado || "Não informado"}</p>}
          <label>Endereço *<input name="endereco" maxLength={255} required defaultValue={property?.endereco ?? ""} placeholder="Rua, avenida..." /></label>
          <label>Número *<input name="numero" maxLength={30} required defaultValue={property?.numero ?? ""} placeholder="123 ou S/N" /></label>
          <label>Complemento<input name="complemento" maxLength={255} defaultValue={property?.complemento ?? ""} placeholder="Apartamento, bloco..." /></label>
          <label>CEP<input name="cep" inputMode="numeric" maxLength={9} pattern="[0-9]{5}-?[0-9]{3}" defaultValue={property?.cep ?? ""} placeholder="99000-000" /></label>
        </div></section>
        <section className="admin-form-section"><h3>Características</h3><div className="admin-form-grid admin-form-counts">
          <label>Quartos<input name="dormitorios" type="number" min="0" max="100" step="1" defaultValue={property?.dormitorios ?? 0} /></label>
          <label>Banheiros<input name="banheiros" type="number" min="0" max="100" step="1" defaultValue={property?.banheiros ?? 0} /></label>
          <label>Vagas<input name="garagem" type="number" min="0" max="100" step="1" defaultValue={property?.garagem ?? 0} /></label>
        </div><div className="admin-form-grid">
          <label>Área total (m²) *<input name="areaTotal" type="number" min="0.01" max="9999999999999.99" step="0.01" required defaultValue={property?.areaTotal ?? ""} /></label>
          <label>Área construída (m²)<input name="areaConstruida" type="number" min="0" max="9999999999999.99" step="0.01" defaultValue={property?.areaConstruida ?? ""} /></label>
          <label className="admin-span-2">Descrição *<textarea name="descricao" required rows={4} maxLength={10000} defaultValue={property?.descricao ?? ""} placeholder="Descreva os ambientes e diferenciais do imóvel." /></label>
          <label className="admin-span-2">Outros diferenciais<textarea name="caracteristicas" rows={2} maxLength={10000} defaultValue={property?.caracteristicas ?? ""} placeholder="Churrasqueira, elevador, mobiliado..." /></label>
        </div></section>
        <section className="admin-form-section" id="property-photos"><h3>Fotos do imóvel</h3>
          <PropertyPhotos photos={photos} onChange={onPhotosChange} />
          <label>Adicionar fotos<input name="fotos" type="file" accept="image/jpeg,image/png,image/webp" multiple /></label>
          <p className="admin-help">Até 10 fotos por envio, com até 10 MB cada. Formatos JPG, PNG ou WebP. As novas fotos serão enviadas ao salvar o imóvel.</p>
        </section>
      </fieldset>
      {error && <div className="admin-form-error"><p className="form-error" role="alert">{error}</p></div>}
      <div className="admin-editor-footer"><button className="secondary-button" type="button" disabled={busy} onClick={onClose}>Cancelar</button><button className="primary-button" type="submit" disabled={busy}>{busy ? "Salvando imóvel e fotos..." : property ? "Salvar alterações" : "Cadastrar imóvel"}</button></div>
    </form>
  </dialog>;
}
