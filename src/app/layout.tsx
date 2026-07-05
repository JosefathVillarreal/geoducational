import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Geoducational - Red de Nodos",
  description: "Conecta municipios, expande tu economía y descubre datos interesantes.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    // 1. Añadimos suppressHydrationWarning aquí para mitigar cambios de clases de temas
    <html lang="es" suppressHydrationWarning>
      <body
        // 2. Bloqueamos alertas por inyecciones de extensiones de terceros (como amp-mask)
        suppressHydrationWarning
        className="antialiased bg-slate-950 text-white selection:bg-emerald-500/30"
      >
        {children}
      </body>
    </html>
  );
}