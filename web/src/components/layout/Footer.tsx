"use client";

import Link from "next/link";
import { Heart, Shield, Lock, Mail } from "lucide-react";
import { Separator } from "@/components/ui/separator";

export function Footer() {
  return (
    <footer className="w-full border-t border-border bg-background">
      <div className="content-section py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="md:col-span-1 space-y-4">
            <Link href="/" className="flex items-center gap-2.5 group">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary transition-colors group-hover:bg-primary/20">
                <Heart className="h-4.5 w-4.5" />
              </div>
              <span className="font-display text-lg font-semibold">Ricordati di Te</span>
            </Link>
            <p className="text-sm text-foreground-muted leading-relaxed max-w-xs">
              Uno spazio digitale sicuro e rispettoso per custodire i ricordi delle persone che
              amiamo.
            </p>
          </div>

          {/* Navigation */}
          <div className="space-y-4">
            <h4 className="font-medium text-sm text-foreground uppercase tracking-wider">
              Piattaforma
            </h4>
            <ul className="space-y-2.5">
              <li>
                <FooterLink href="/come-funziona">Come funziona</FooterLink>
              </li>
              <li>
                <FooterLink href="/principi">Principi della community</FooterLink>
              </li>
              <li>
                <FooterLink href="/ricerca">Ricerca memoriali</FooterLink>
              </li>
              <li>
                <FooterLink href="/accessibilita">Accessibilita</FooterLink>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div className="space-y-4">
            <h4 className="font-medium text-sm text-foreground uppercase tracking-wider">
              Legale
            </h4>
            <ul className="space-y-2.5">
              <li>
                <FooterLink href="/privacy">
                  <Lock className="inline h-3.5 w-3.5 mr-1.5" />
                  Privacy
                </FooterLink>
              </li>
              <li>
                <FooterLink href="/termini">Termini e condizioni</FooterLink>
              </li>
              <li>
                <FooterLink href="/segnalazione">
                  <Shield className="inline h-3.5 w-3.5 mr-1.5" />
                  Segnala contenuto
                </FooterLink>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div className="space-y-4">
            <h4 className="font-medium text-sm text-foreground uppercase tracking-wider">
              Contatti
            </h4>
            <ul className="space-y-2.5">
              <li className="flex items-center gap-2 text-sm text-foreground-muted">
                <Mail className="h-4 w-4" />
                <span>supporto@ricordatidite.it</span>
              </li>
            </ul>
          </div>
        </div>

        <Separator className="my-8" />

        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-foreground-subtle">
          <p>&copy; {new Date().getFullYear()} Ricordati di Te. Tutti i diritti riservati.</p>
          <p>
            Progettato con rispetto e cura per chi non c&apos;e piu.
          </p>
        </div>
      </div>
    </footer>
  );
}

function FooterLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="text-sm text-foreground-muted hover:text-foreground transition-colors"
    >
      {children}
    </Link>
  );
}
