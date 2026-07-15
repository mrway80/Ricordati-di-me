import type { Metadata, Viewport } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

const playfair = Playfair_Display({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-playfair",
});

export const metadata: Metadata = {
  title: {
    default: "Ricordati di Te — Un luogo per ricordare",
    template: "%s — Ricordati di Te",
  },
  description:
    "Crea e custodisci pagine memoriali per i tuoi cari. Uno spazio sicuro, rispettoso e privato per condividere ricordi, fotografie e celebrare vite vissute.",
  keywords: [
    "memoriale",
    "ricordo",
    "persona cara",
    "celebrazione vita",
    "condoglianze",
    "social memoriale",
  ],
  authors: [{ name: "Ricordati di Te" }],
  creator: "Ricordati di Te",
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL ?? "https://ricordatidite.it"
  ),
  openGraph: {
    type: "website",
    locale: "it_IT",
    siteName: "Ricordati di Te",
    title: "Ricordati di Te — Un luogo per ricordare",
    description:
      "Crea e custodisci pagine memoriali per i tuoi cari. Uno spazio sicuro, rispettoso e privato per condividere ricordi.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Ricordati di Te",
    description: "Un luogo sicuro e rispettoso per ricordare i tuoi cari.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  icons: {
    icon: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },
  manifest: "/site.webmanifest",
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#FDF8F3" },
    { media: "(prefers-color-scheme: dark)", color: "#2A2420" },
  ],
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="it" className={`${inter.variable} ${playfair.variable}`}>
      <body className="min-h-screen bg-background text-foreground antialiased">
        {children}
      </body>
    </html>
  );
}
