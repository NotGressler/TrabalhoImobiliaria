import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  icons: { icon: "/images/logo-jg.png" },
  title: "JG Imóveis | Encontre o imóvel que combina com a sua história",
  description: "Imóveis para venda e locação escolhidos para combinar com a vida que você quer construir.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
