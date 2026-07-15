"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Heart, Eye, EyeOff, AlertCircle, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { signUp } from "@/app/actions/auth";

export default function RegisterPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const [loading, setLoading] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setFieldErrors({});
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const password = formData.get("password") as string;
    const confirmPassword = formData.get("confirmPassword") as string;

    if (password !== confirmPassword) {
      setFieldErrors({ confirmPassword: ["Le password non coincidono"] });
      setLoading(false);
      return;
    }

    if (!acceptedTerms) {
      setError("Devi accettare i termini e condizioni");
      setLoading(false);
      return;
    }

    const result = await signUp({
      email: formData.get("email") as string,
      password,
      confirmPassword,
      fullName: formData.get("fullName") as string,
      displayName: (formData.get("displayName") as string) || undefined,
      acceptedTerms: true,
    });

    setLoading(false);

    if (!result.success) {
      if (result.error?.details) {
        setFieldErrors(result.error.details as Record<string, string[]>);
      }
      setError(result.error?.message ?? "Errore nella registrazione");
      return;
    }

    // Show success and redirect
    router.push("/verifica-email?email=" + encodeURIComponent(formData.get("email") as string));
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-12 bg-gradient-to-b from-primary/[0.02] to-transparent">
      <div className="w-full max-w-md space-y-8">
        {/* Logo */}
        <div className="text-center space-y-4">
          <Link href="/" className="inline-flex items-center gap-2.5 group">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Heart className="h-5 w-5" />
            </div>
            <span className="font-display text-xl font-semibold">Ricordati di Te</span>
          </Link>
          <div>
            <h1 className="font-display text-2xl sm:text-3xl font-semibold">
              Crea il tuo account
            </h1>
            <p className="text-foreground-muted mt-2">
              Inizia a custodire i ricordi dei tuoi cari
            </p>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="fullName">Nome completo *</Label>
            <Input
              id="fullName"
              name="fullName"
              placeholder="Mario Rossi"
              required
              minLength={2}
              maxLength={200}
              className={fieldErrors.fullName ? "border-error" : ""}
            />
            {fieldErrors.fullName && (
              <p className="text-xs text-error">{fieldErrors.fullName[0]}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="displayName">Nome visualizzato (opzionale)</Label>
            <Input
              id="displayName"
              name="displayName"
              placeholder="Come vuoi essere chiamato"
              maxLength={100}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email *</Label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="tu@email.com"
              required
              maxLength={254}
              className={fieldErrors.email ? "border-error" : ""}
            />
            {fieldErrors.email && (
              <p className="text-xs text-error">{fieldErrors.email[0]}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password *</Label>
            <div className="relative">
              <Input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                placeholder="Minimo 12 caratteri"
                required
                minLength={12}
                maxLength={128}
                className={fieldErrors.password ? "border-error pr-10" : "pr-10"}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-foreground-muted hover:text-foreground"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {fieldErrors.password && (
              <p className="text-xs text-error">{fieldErrors.password[0]}</p>
            )}
            <PasswordRequirements />
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Conferma password *</Label>
            <div className="relative">
              <Input
                id="confirmPassword"
                name="confirmPassword"
                type={showConfirm ? "text" : "password"}
                placeholder="Ripeti la password"
                required
                className={fieldErrors.confirmPassword ? "border-error pr-10" : "pr-10"}
              />
              <button
                type="button"
                onClick={() => setShowConfirm(!showConfirm)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-foreground-muted hover:text-foreground"
              >
                {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {fieldErrors.confirmPassword && (
              <p className="text-xs text-error">{fieldErrors.confirmPassword[0]}</p>
            )}
          </div>

          <div className="flex items-start gap-2.5">
            <input
              type="checkbox"
              id="terms"
              checked={acceptedTerms}
              onChange={(e) => setAcceptedTerms(e.target.checked)}
              className="mt-1 h-4 w-4 rounded border-border text-primary focus:ring-primary"
            />
            <label htmlFor="terms" className="text-sm text-foreground-muted leading-relaxed">
              Ho letto e accetto i{" "}
              <Link href="/termini" className="text-primary hover:underline" target="_blank">
                Termini e condizioni
              </Link>{" "}
              e la{" "}
              <Link href="/privacy" className="text-primary hover:underline" target="_blank">
                Privacy Policy
              </Link>{" "}
              *
            </label>
          </div>

          <Button type="submit" className="w-full" size="lg" disabled={loading}>
            {loading ? "Registrazione in corso..." : "Crea account"}
          </Button>
        </form>

        <Separator />

        <p className="text-center text-sm text-foreground-muted">
          Hai gia un account?{" "}
          <Link href="/login" className="text-primary font-medium hover:underline">
            Accedi
          </Link>
        </p>
      </div>
    </div>
  );
}

function PasswordRequirements() {
  return (
    <div className="text-xs text-foreground-subtle space-y-1 pt-1">
      <p className="font-medium">La password deve contenere:</p>
      <ul className="space-y-0.5 pl-1">
        <li className="flex items-center gap-1.5">
          <CheckCircle className="h-3 w-3" />
          Almeno 12 caratteri
        </li>
        <li className="flex items-center gap-1.5">
          <CheckCircle className="h-3 w-3" />
          Una lettera maiuscola
        </li>
        <li className="flex items-center gap-1.5">
          <CheckCircle className="h-3 w-3" />
          Una lettera minuscola
        </li>
        <li className="flex items-center gap-1.5">
          <CheckCircle className="h-3 w-3" />
          Un numero
        </li>
        <li className="flex items-center gap-1.5">
          <CheckCircle className="h-3 w-3" />
          Un carattere speciale
        </li>
      </ul>
    </div>
  );
}
