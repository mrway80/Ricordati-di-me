import type { Metadata, Viewport } from "next";
import { Instrument_Sans, JetBrains_Mono, Newsreader } from "next/font/google";
import "./globals.css";

const instrument = Instrument_Sans({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-instrument",
});

const newsreader = Newsreader({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-newsreader",
  style: ["normal", "italic"],
});

const jetbrains = JetBrains_Mono({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-jetbrains",
});

function getMetadataBase(): URL {
  const raw = process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (raw) {
    try {
      return new URL(raw);
    } catch {
      // fall through to default
    }
  }
  return new URL("https://ricordati-di-me.vercel.app");
}

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
  metadataBase: getMetadataBase(),
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
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#fdfaf2" },
    { media: "(prefers-color-scheme: dark)", color: "#302a20" },
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
    <html
      lang="it"
      className={`${instrument.variable} ${newsreader.variable} ${jetbrains.variable}`}
    >
      <body className="min-h-screen bg-background text-foreground antialiased font-sans">
        {children}
      </body>
    </html>
  );
}
