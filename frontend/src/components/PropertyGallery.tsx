"use client";

import { useRef, useState } from "react";
import type { PropertyPhoto } from "../app/PropertyShowcase";
import PropertyImage from "./PropertyImage";

export default function PropertyGallery({ photos, apiUrl, title }: { photos: PropertyPhoto[]; apiUrl: string; title: string }) {
  const [index, setIndex] = useState(0);
  const touch = useRef<{ x: number; y: number } | null>(null);
  const count = photos.length;
  const url = (photo: PropertyPhoto) => `${apiUrl}/fotos/${photo.imovelId}/${encodeURIComponent(photo.nomeArquivo)}`;
  const move = (direction: number) => { if (count > 1) setIndex((current) => (current + direction + count) % count); };

  return <section className="property-gallery" aria-label={`Fotos de ${title}`} aria-roledescription="carrossel" tabIndex={0}
    onKeyDown={(event) => {
      if (event.key === "ArrowLeft" || event.key === "ArrowRight") { event.preventDefault(); move(event.key === "ArrowLeft" ? -1 : 1); }
    }}>
    <div className="gallery-stage"
      onTouchStart={(event) => { touch.current = { x: event.touches[0].clientX, y: event.touches[0].clientY }; }}
      onTouchEnd={(event) => {
        if (!touch.current) return;
        const dx = event.changedTouches[0].clientX - touch.current.x;
        const dy = event.changedTouches[0].clientY - touch.current.y;
        if (Math.abs(dx) > 45 && Math.abs(dx) > Math.abs(dy)) move(dx < 0 ? 1 : -1);
        touch.current = null;
      }}>
      {count ? <PropertyImage key={url(photos[index])} src={url(photos[index])} alt={`${title}, foto ${index + 1} de ${count}`} loading="eager" />
        : <div className="gallery-empty"><svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" aria-hidden="true"><path d="m3 10 9-7 9 7v10H3V10Z" /><path d="M9 20v-7h6v7" /></svg><p>Este imóvel ainda não tem fotos.</p></div>}
      {count > 1 && <>
        <button className="gallery-arrow gallery-previous" type="button" onClick={() => move(-1)} aria-label="Foto anterior"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><path d="m15 5-7 7 7 7" /></svg></button>
        <button className="gallery-arrow gallery-next" type="button" onClick={() => move(1)} aria-label="Próxima foto"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><path d="m9 5 7 7-7 7" /></svg></button>
      </>}
      {count > 0 && <span className="gallery-counter" role="status" aria-live="polite">Foto {index + 1} de {count}</span>}
    </div>
    {count > 1 && <div className="gallery-thumbnails" aria-label="Selecionar foto">
      {photos.map((photo, position) => <button type="button" className={position === index ? "gallery-thumbnail is-active" : "gallery-thumbnail"} key={`${photo.nomeArquivo}-${position}`} aria-label={`Ver foto ${position + 1}`} aria-pressed={position === index} onClick={() => setIndex(position)}>
        <PropertyImage src={url(photo)} alt={`Miniatura ${position + 1} de ${title}`} />
      </button>)}
    </div>}
  </section>;
}
