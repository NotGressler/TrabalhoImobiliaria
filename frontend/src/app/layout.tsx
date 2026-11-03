import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Morada | Encontre seu próximo lar",
  description: "Imóveis para venda e locação escolhidos para combinar com a vida que você quer construir.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
