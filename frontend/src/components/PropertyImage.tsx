"use client";

import { useState } from "react";

export default function PropertyImage({ src, alt, loading = "lazy" }: { src: string | null; alt: string; loading?: "lazy" | "eager" }) {
  const [failed, setFailed] = useState(false);
  if (!src || failed) return <div className="image-placeholder" role="img" aria-label={`${alt}: foto indisponível`} />;
  // eslint-disable-next-line @next/next/no-img-element -- As fotos vêm da origem configurável da API Spring.
  return <img className="property-image" src={src} alt={alt} loading={loading} onError={() => setFailed(true)} />;
}
