"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Mail, Heart } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function VerificaEmailPage() {
  const searchParams = useSearchParams();
  const email = searchParams.get("email");

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-12 bg-gradient-to-b from-primary/[0.02] to-transparent">
      <div className="w-full max-w-md space-y-8 text-center">
        <Link href="/" className="inline-flex items-center gap-2.5 group">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Heart className="h-5 w-5" />
          </div>
          <span className="font-display text-xl font-semibold">Ricordati di Te</span>
        </Link>

        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary">
          <Mail className="h-8 w-8" />
        </div>

        <div className="space-y-3">
          <h1 className="font-display text-2xl sm:text-3xl font-semibold">
            Controlla la tua email
          </h1>
          <p className="text-foreground-muted leading-relaxed">
            {email ? (
              <>
                Abbiamo inviato un link di conferma a{" "}
                <span className="font-medium text-foreground">{email}</span>. Clicca sul link
                nell&apos;email per attivare il tuo account.
              </>
            ) : (
              <>
                Abbiamo inviato un link di conferma al tuo indirizzo email. Clicca sul link per
                attivare il tuo account.
              </>
            )}
          </p>
          <p className="text-sm text-foreground-subtle">
            Non hai ricevuto l&apos;email? Controlla la cartella spam o attendi qualche minuto.
          </p>
        </div>

        <div className="flex flex-col gap-3">
          <Link href="/login" className={cn(buttonVariants({ size: "lg" }), "w-full")}>
            Vai al login
          </Link>
          <Link
            href="/"
            className={cn(buttonVariants({ variant: "outline", size: "lg" }), "w-full")}
          >
            Torna alla home
          </Link>
        </div>
      </div>
    </div>
  );
}
