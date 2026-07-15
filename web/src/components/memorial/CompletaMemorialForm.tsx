"use client";

import { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { updateMemorial } from "@/app/actions/memorial";
import { getMessages, t, type Locale } from "@/i18n";

interface CompletaMemorialFormProps {
  memorialId: string;
  slug: string;
  initialBirthDate?: string | null;
  initialDeathDate?: string | null;
  initialBirthPlace?: string | null;
  initialDeathPlace?: string | null;
  initialBiography?: string | null;
  locale?: Locale;
}

export function CompletaMemorialForm({
  memorialId,
  slug,
  initialBirthDate,
  initialDeathDate,
  initialBirthPlace,
  initialDeathPlace,
  initialBiography,
  locale = "it",
}: CompletaMemorialFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const focus = searchParams.get("focus");
  const m = getMessages(locale);

  const [birthDate, setBirthDate] = useState(initialBirthDate ?? "");
  const [deathDate, setDeathDate] = useState(initialDeathDate ?? "");
  const [birthPlace, setBirthPlace] = useState(initialBirthPlace ?? "");
  const [deathPlace, setDeathPlace] = useState(initialDeathPlace ?? "");
  const [biography, setBiography] = useState(initialBiography ?? "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const showDates = focus !== "bio";
  const showBio = focus !== "dates";

  const title = useMemo(() => {
    if (focus === "dates") return t(m, "onboarding.datesTitle");
    if (focus === "bio") return t(m, "onboarding.bioTitle");
    return t(m, "onboarding.title");
  }, [focus, m]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const result = await updateMemorial({
      id: memorialId,
      birthDate: birthDate || undefined,
      deathDate: deathDate || undefined,
      birthPlace: birthPlace || undefined,
      deathPlace: deathPlace || undefined,
      biography: biography || undefined,
    });

    setLoading(false);

    if (!result.success) {
      setError(result.error?.message ?? t(m, "create.errorGeneric"));
      return;
    }

    router.push(`/memoriale/${slug}`);
    router.refresh();
  }

  return (
    <div className="min-h-[100dvh] bg-muted/20">
      <div className="content-section max-w-lg mx-auto px-4 py-4 sm:py-8">
        <Link
          href={`/memoriale/${slug}`}
          className="inline-flex items-center gap-1 min-h-11 -ml-2 px-2 text-sm text-foreground-muted"
        >
          <ChevronLeft className="h-5 w-5" />
          {t(m, "create.back")}
        </Link>

        <h1 className="font-display text-2xl font-semibold mt-4 mb-6">{title}</h1>

        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {showDates && (
            <section className="space-y-4 rounded-2xl border bg-background p-4">
              <div className="grid grid-cols-1 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="birthDate">{t(m, "onboarding.datesCta")} — nascita</Label>
                  <Input
                    id="birthDate"
                    type="date"
                    value={birthDate}
                    onChange={(e) => setBirthDate(e.target.value)}
                    className="h-12 text-base"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="birthPlace">Luogo di nascita</Label>
                  <Input
                    id="birthPlace"
                    value={birthPlace}
                    onChange={(e) => setBirthPlace(e.target.value)}
                    className="h-12 text-base"
                    maxLength={200}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="deathDate">Data della scomparsa</Label>
                  <Input
                    id="deathDate"
                    type="date"
                    value={deathDate}
                    onChange={(e) => setDeathDate(e.target.value)}
                    className="h-12 text-base"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="deathPlace">Luogo della scomparsa</Label>
                  <Input
                    id="deathPlace"
                    value={deathPlace}
                    onChange={(e) => setDeathPlace(e.target.value)}
                    className="h-12 text-base"
                    maxLength={200}
                  />
                </div>
              </div>
            </section>
          )}

          {showBio && (
            <section className="space-y-2 rounded-2xl border bg-background p-4">
              <Label htmlFor="biography">{t(m, "onboarding.bioTitle")}</Label>
              <Textarea
                id="biography"
                value={biography}
                onChange={(e) => setBiography(e.target.value)}
                rows={6}
                maxLength={10000}
                className="text-base resize-vertical min-h-32"
                placeholder={t(m, "onboarding.bioHint")}
              />
            </section>
          )}

          <div className="sticky bottom-0 pt-2 pb-[max(1rem,env(safe-area-inset-bottom))]">
            <Button type="submit" size="lg" className="w-full h-12 text-base" disabled={loading}>
              {loading ? t(m, "create.submitting") : t(m, "create.next")}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
