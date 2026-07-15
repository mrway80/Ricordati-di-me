"use client";

import { useState } from "react";
import Link from "next/link";
import { Shield, AlertCircle, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Textarea } from "@/components/ui/textarea";

export default function SegnalazionePage() {
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    // Placeholder: in futuro collegheremo content_reports via API
    await new Promise((resolve) => setTimeout(resolve, 600));

    setLoading(false);
    setSent(true);
  }

  return (
    <div className="min-h-screen bg-background">
      <section className="bg-primary/5 py-12 md:py-20">
        <div className="container mx-auto px-4 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Shield className="h-7 w-7" />
          </div>
          <h1 className="text-4xl font-bold tracking-tight text-foreground md:text-5xl">
            Segnala un contenuto
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">
            Aiutaci a mantenere la piattaforma rispettosa e sicura segnalando contenuti
            inappropriati.
          </p>
        </div>
      </section>

      <section className="container mx-auto px-4 py-12 md:py-16">
        <div className="mx-auto max-w-xl">
          {sent ? (
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                Grazie per la segnalazione. Il nostro team la esaminerà al più presto. Per
                urgenze puoi scrivere a{" "}
                <a href="mailto:supporto@ricordatidite.it" className="text-primary hover:underline">
                  supporto@ricordatidite.it
                </a>
                .
              </AlertDescription>
            </Alert>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="url">URL del contenuto (opzionale)</Label>
                <Input id="url" name="url" type="url" placeholder="https://..." />
              </div>

              <div className="space-y-2">
                <Label htmlFor="reason">Motivo della segnalazione *</Label>
                <Textarea
                  id="reason"
                  name="reason"
                  placeholder="Descrivi il problema..."
                  required
                  minLength={10}
                  rows={5}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">La tua email (opzionale)</Label>
                <Input id="email" name="email" type="email" placeholder="tu@email.com" />
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Invio in corso..." : "Invia segnalazione"}
              </Button>
            </form>
          )}

          <p className="mt-8 text-center text-sm text-muted-foreground">
            <Link href="/" className="text-primary hover:underline">
              Torna alla home
            </Link>
          </p>
        </div>
      </section>
    </div>
  );
}
