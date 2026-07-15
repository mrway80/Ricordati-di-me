"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Heart, AlertCircle, ChevronLeft, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { createMemorial } from "@/app/actions/memorial";

export default function CreateMemorialPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const [loading, setLoading] = useState(false);
  const [guardianRelationship, setGuardianRelationship] = useState("");
  const [visibility, setVisibility] = useState<"public" | "private" | "invitation_only">(
    "public"
  );

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setFieldErrors({});
    setLoading(true);

    const formData = new FormData(e.currentTarget);

    if (!guardianRelationship) {
      setFieldErrors({ guardianRelationship: ["Indica il tuo legame con la persona"] });
      setLoading(false);
      return;
    }

    const result = await createMemorial({
      firstName: formData.get("firstName") as string,
      lastName: formData.get("lastName") as string,
      nickname: (formData.get("nickname") as string) || undefined,
      birthDate: (formData.get("birthDate") as string) || undefined,
      birthPlace: (formData.get("birthPlace") as string) || undefined,
      deathDate: (formData.get("deathDate") as string) || undefined,
      deathPlace: (formData.get("deathPlace") as string) || undefined,
      biography: (formData.get("biography") as string) || undefined,
      visibility,
      guardianRelationship,
      guardianRelationshipDescription:
        (formData.get("guardianRelationshipDescription") as string) || undefined,
    });

    setLoading(false);

    if (!result.success) {
      if (result.error?.details) {
        setFieldErrors(result.error.details as Record<string, string[]>);
      }
      setError(result.error?.message ?? "Errore nella creazione del memoriale");
      return;
    }

    // Redirect to the new memorial
    router.push(`/memoriale/${result.data!.slug}`);
  }

  return (
    <div className="min-h-screen bg-muted/20">
      <div className="content-section py-8 sm:py-12">
        <div className="max-w-2xl mx-auto space-y-8">
          {/* Header */}
          <div className="space-y-4">
            <Button variant="ghost" size="sm"  className="pl-0">
              <Link href="/dashboard">
                <ChevronLeft className="mr-1 h-4 w-4" />
                Torna alla dashboard
              </Link>
            </Button>
            <div>
              <h1 className="font-display text-3xl font-semibold flex items-center gap-3">
                <Heart className="h-7 w-7 text-primary" />
                Crea un memoriale
              </h1>
              <p className="text-foreground-muted mt-2">
                Compila i dati della persona che vuoi ricordare. Sarai il Custode della Memoria.
              </p>
            </div>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Person Info */}
            <section className="memorial-card p-6 space-y-5">
              <h2 className="font-display text-lg font-semibold flex items-center gap-2">
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-display font-bold">
                  1
                </span>
                Dati della persona
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">Nome *</Label>
                  <Input
                    id="firstName"
                    name="firstName"
                    placeholder="Mario"
                    required
                    maxLength={100}
                    className={fieldErrors.firstName ? "border-error" : ""}
                  />
                  {fieldErrors.firstName && (
                    <p className="text-xs text-error">{fieldErrors.firstName[0]}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Cognome *</Label>
                  <Input
                    id="lastName"
                    name="lastName"
                    placeholder="Rossi"
                    required
                    maxLength={100}
                    className={fieldErrors.lastName ? "border-error" : ""}
                  />
                  {fieldErrors.lastName && (
                    <p className="text-xs text-error">{fieldErrors.lastName[0]}</p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="nickname">Soprannome (opzionale)</Label>
                <Input
                  id="nickname"
                  name="nickname"
                  placeholder="Come la chiamavano gli amici"
                  maxLength={100}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="birthDate">Data di nascita</Label>
                  <Input id="birthDate" name="birthDate" type="date" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="birthPlace">Luogo di nascita</Label>
                  <Input
                    id="birthPlace"
                    name="birthPlace"
                    placeholder="Citta, Paese"
                    maxLength={200}
                  />
                </div>
              </div>

              <Separator />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="deathDate">Data della scomparsa</Label>
                  <Input id="deathDate" name="deathDate" type="date" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="deathPlace">Luogo della scomparsa</Label>
                  <Input
                    id="deathPlace"
                    name="deathPlace"
                    placeholder="Citta, Paese"
                    maxLength={200}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="biography">Biografia (opzionale)</Label>
                <Textarea
                  id="biography"
                  name="biography"
                  placeholder="Racconta chi era questa persona: passioni, lavoro, personalita, ricordi significativi..."
                  rows={6}
                  maxLength={10000}
                  className="resize-vertical"
                />
                <p className="text-xs text-foreground-subtle">
                  Max 10.000 caratteri. Puoi aggiungerla o modificarla in seguito.
                </p>
              </div>
            </section>

            {/* Guardian Info */}
            <section className="memorial-card p-6 space-y-5">
              <h2 className="font-display text-lg font-semibold flex items-center gap-2">
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-display font-bold">
                  2
                </span>
                Il tuo legame
              </h2>
              <p className="text-sm text-foreground-muted">
                Indica il tuo rapporto con questa persona. Questo ti designa come{" "}
                <strong>Custode della Memoria</strong>.
              </p>

              <div className="space-y-2">
                <Label htmlFor="guardianRelationship">Tipo di legame *</Label>
                <select
                  id="guardianRelationship"
                  name="guardianRelationship"
                  required
                  value={guardianRelationship}
                  onChange={(e) => setGuardianRelationship(e.target.value)}
                  className={`flex h-9 w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 ${
                    fieldErrors.guardianRelationship ? "border-error" : ""
                  }`}
                >
                  <option value="">Seleziona il tuo legame</option>
                  <option value="figlio">Figlio/Figlia</option>
                  <option value="coniuge">Coniuge</option>
                  <option value="genitore">Genitore</option>
                  <option value="fratello">Fratello/Sorella</option>
                  <option value="nipote">Nipote</option>
                  <option value="cugino">Cugino/Cugina</option>
                  <option value="amico">Amico/Amica</option>
                  <option value="collega">Collega</option>
                  <option value="altro">Altro</option>
                </select>
                {fieldErrors.guardianRelationship && (
                  <p className="text-xs text-error">{fieldErrors.guardianRelationship[0]}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="guardianRelationshipDescription">
                  Descrivi il tuo legame (opzionale)
                </Label>
                <Textarea
                  id="guardianRelationshipDescription"
                  name="guardianRelationshipDescription"
                  placeholder="Eri il figlio maggiore, la moglie, il migliore amico..."
                  rows={3}
                  maxLength={500}
                />
              </div>
            </section>

            {/* Privacy */}
            <section className="memorial-card p-6 space-y-5">
              <h2 className="font-display text-lg font-semibold flex items-center gap-2">
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-display font-bold">
                  3
                </span>
                Privacy
              </h2>

              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Label htmlFor="visibility">Visibilita del memoriale</Label>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger >
                        <Info className="h-4 w-4 text-foreground-subtle cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent className="max-w-xs">
                        <p>Decidi chi può vedere il memoriale. Puoi cambiare questa impostazione in qualsiasi momento.</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <select
                  id="visibility"
                  name="visibility"
                  value={visibility}
                  onChange={(e) =>
                    setVisibility(
                      e.target.value as "public" | "private" | "invitation_only"
                    )
                  }
                  className="flex h-9 w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                >
                  <option value="public">Pubblico — Chiunque può visualizzare</option>
                  <option value="invitation_only">Su invito — Solo chi riceve un invito</option>
                  <option value="private">Privato — Solo membri approvati</option>
                </select>
              </div>
            </section>

            {/* Submit */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4">
              <p className="text-sm text-foreground-subtle">
                * Campi obbligatori
              </p>
              <div className="flex gap-3 w-full sm:w-auto">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1 sm:flex-none"
                  
                >
                  <Link href="/dashboard">Annulla</Link>
                </Button>
                <Button type="submit" size="lg" disabled={loading} className="flex-1 sm:flex-none">
                  {loading ? "Creazione in corso..." : "Crea memoriale"}
                </Button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
