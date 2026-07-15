"use client";

import { useState } from "react";
import Link from "next/link";
import { Heart, AlertCircle, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { createClient } from "@/lib/supabase/client";

export default function RecuperoPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const supabase = createClient();
    const redirectTo = `${window.location.origin}/login`;

    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo,
    });

    setLoading(false);

    if (resetError) {
      setError(resetError.message);
      return;
    }

    setSent(true);
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-12 bg-gradient-to-b from-primary/[0.02] to-transparent">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center space-y-4">
          <Link href="/" className="inline-flex items-center gap-2.5 group">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Heart className="h-5 w-5" />
            </div>
            <span className="font-display text-xl font-semibold">Ricordati di Te</span>
          </Link>
          <div>
            <h1 className="font-display text-2xl sm:text-3xl font-semibold">
              Recupera la password
            </h1>
            <p className="text-foreground-muted mt-2">
              Inserisci la tua email e ti invieremo un link per reimpostare la password.
            </p>
          </div>
        </div>

        {sent ? (
          <Alert>
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>
              Se l&apos;email è registrata, riceverai a breve un link per reimpostare la password.
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
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="tu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <Button type="submit" className="w-full" size="lg" disabled={loading}>
              {loading ? "Invio in corso..." : "Invia link di recupero"}
            </Button>
          </form>
        )}

        <p className="text-center text-sm text-foreground-muted">
          <Link href="/login" className="text-primary font-medium hover:underline">
            Torna al login
          </Link>
        </p>
      </div>
    </div>
  );
}
