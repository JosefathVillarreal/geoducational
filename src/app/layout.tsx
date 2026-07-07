import type { Metadata } from "next";
import "./globals.css";

// Actualiza la sección de metadata en src/app/layout.tsx para que luzca así:
export const metadata: Metadata = {
  title: "Geoducational - Red de Nodos",
  description: "Conecta municipios, expande tu economía y descubre datos interesantes.",
  // 🔑 Bloquea gestos del navegador móvil para que el mapa se sienta como una app nativa
  viewport: "width=device-device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no",
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