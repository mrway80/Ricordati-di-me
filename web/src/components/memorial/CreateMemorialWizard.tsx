"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Heart, AlertCircle, ChevronLeft, ChevronRight, Lock, Users, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { createMemorial } from "@/app/actions/memorial";
import { getMessages, t, type Locale } from "@/i18n";
import { cn } from "@/lib/utils";

const TOTAL_STEPS = 3;

const RELATIONSHIP_KEYS = [
  "figlio",
  "coniuge",
  "genitore",
  "fratello",
  "nipote",
  "cugino",
  "amico",
  "collega",
  "altro",
] as const;

type Visibility = "public" | "private" | "invitation_only";

interface CreateMemorialWizardProps {
  locale?: Locale;
}

export function CreateMemorialWizard({ locale = "it" }: CreateMemorialWizardProps) {
  const router = useRouter();
  const m = getMessages(locale);

  const [step, setStep] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [guardianRelationship, setGuardianRelationship] = useState("");
  const [visibility, setVisibility] = useState<Visibility>("public");

  function validateStep(current: number): boolean {
    setError(null);
    if (current === 1) {
      if (!firstName.trim()) {
        setError(t(m, "create.errorFirstName"));
        return false;
      }
      if (!lastName.trim()) {
        setError(t(m, "create.errorLastName"));
        return false;
      }
    }
    if (current === 2 && !guardianRelationship) {
      setError(t(m, "create.errorRelationship"));
      return false;
    }
    return true;
  }

  function goNext() {
    if (!validateStep(step)) return;
    setStep((s) => Math.min(s + 1, TOTAL_STEPS));
  }

  function goBack() {
    setError(null);
    setStep((s) => Math.max(s - 1, 1));
  }

  async function handleCreate() {
    if (!validateStep(1) || !validateStep(2)) {
      setStep(1);
      return;
    }
    setLoading(true);
    setError(null);

    const result = await createMemorial({
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      visibility,
      guardianRelationship,
    });

    setLoading(false);

    if (!result.success) {
      setError(result.error?.message ?? t(m, "create.errorGeneric"));
      return;
    }

    router.push(`/memoriale/${result.data!.slug}?onboarding=1`);
  }

  const progress = (step / TOTAL_STEPS) * 100;

  return (
    <div className="min-h-[100dvh] bg-muted/20 flex flex-col">
      <div className="content-section flex-1 flex flex-col py-4 sm:py-8 max-w-lg mx-auto w-full px-4">
        {/* Top bar */}
        <div className="flex items-center justify-between gap-3 mb-4">
          {step > 1 ? (
            <button
              type="button"
              onClick={goBack}
              className="inline-flex items-center gap-1 min-h-11 px-2 -ml-2 text-sm text-foreground-muted hover:text-foreground"
            >
              <ChevronLeft className="h-5 w-5" />
              {t(m, "create.back")}
            </button>
          ) : (
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-1 min-h-11 px-2 -ml-2 text-sm text-foreground-muted hover:text-foreground"
            >
              <ChevronLeft className="h-5 w-5" />
              {t(m, "create.cancel")}
            </Link>
          )}
          <span className="text-xs text-foreground-subtle tabular-nums">
            {t(m, "create.stepOf", { current: step, total: TOTAL_STEPS })}
          </span>
        </div>

        {/* Progress */}
        <div
          className="h-1.5 w-full rounded-full bg-border overflow-hidden mb-6"
          role="progressbar"
          aria-valuenow={step}
          aria-valuemin={1}
          aria-valuemax={TOTAL_STEPS}
        >
          <div
            className="h-full bg-primary transition-all duration-300 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>

        <header className="mb-6 space-y-2">
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Heart className="h-5 w-5" />
            </div>
            <h1 className="font-display text-2xl sm:text-3xl font-semibold">
              {t(m, "create.title")}
            </h1>
          </div>
          <p className="text-foreground-muted text-sm sm:text-base">{t(m, "create.subtitle")}</p>
        </header>

        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="flex-1 space-y-6">
          {step === 1 && (
            <section className="space-y-5" aria-labelledby="step1-title">
              <div>
                <h2 id="step1-title" className="font-display text-xl font-semibold">
                  {t(m, "create.step1Title")}
                </h2>
                <p className="text-sm text-foreground-muted mt-1">{t(m, "create.step1Hint")}</p>
              </div>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">{t(m, "create.firstName")}</Label>
                  <Input
                    id="firstName"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder={t(m, "create.firstNamePlaceholder")}
                    maxLength={100}
                    autoComplete="given-name"
                    autoFocus
                    className="h-12 text-base"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">{t(m, "create.lastName")}</Label>
                  <Input
                    id="lastName"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder={t(m, "create.lastNamePlaceholder")}
                    maxLength={100}
                    autoComplete="family-name"
                    className="h-12 text-base"
                  />
                </div>
              </div>
            </section>
          )}

          {step === 2 && (
            <section className="space-y-5" aria-labelledby="step2-title">
              <div>
                <h2 id="step2-title" className="font-display text-xl font-semibold">
                  {t(m, "create.step2Title")}
                </h2>
                <p className="text-sm text-foreground-muted mt-1">{t(m, "create.step2Hint")}</p>
              </div>
              <fieldset className="space-y-2">
                <legend className="sr-only">{t(m, "create.relationship")}</legend>
                <div className="grid grid-cols-1 gap-2">
                  {RELATIONSHIP_KEYS.map((key) => {
                    const selected = guardianRelationship === key;
                    return (
                      <button
                        key={key}
                        type="button"
                        onClick={() => setGuardianRelationship(key)}
                        className={cn(
                          "min-h-12 w-full rounded-xl border px-4 py-3 text-left text-base transition-colors",
                          selected
                            ? "border-primary bg-primary/10 text-foreground font-medium"
                            : "border-border bg-background hover:bg-muted/50"
                        )}
                      >
                        {t(m, `create.relationships.${key}`)}
                      </button>
                    );
                  })}
                </div>
              </fieldset>
            </section>
          )}

          {step === 3 && (
            <section className="space-y-5" aria-labelledby="step3-title">
              <div>
                <h2 id="step3-title" className="font-display text-xl font-semibold">
                  {t(m, "create.step3Title")}
                </h2>
                <p className="text-sm text-foreground-muted mt-1">{t(m, "create.step3Hint")}</p>
              </div>
              <div className="grid grid-cols-1 gap-2">
                {(
                  [
                    {
                      value: "public" as const,
                      icon: Globe,
                      title: t(m, "create.visibilityPublic"),
                      hint: t(m, "create.visibilityPublicHint"),
                    },
                    {
                      value: "invitation_only" as const,
                      icon: Users,
                      title: t(m, "create.visibilityInvite"),
                      hint: t(m, "create.visibilityInviteHint"),
                    },
                    {
                      value: "private" as const,
                      icon: Lock,
                      title: t(m, "create.visibilityPrivate"),
                      hint: t(m, "create.visibilityPrivateHint"),
                    },
                  ] as const
                ).map((opt) => {
                  const selected = visibility === opt.value;
                  const Icon = opt.icon;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setVisibility(opt.value)}
                      className={cn(
                        "min-h-14 w-full rounded-xl border px-4 py-3 text-left transition-colors flex items-start gap-3",
                        selected
                          ? "border-primary bg-primary/10"
                          : "border-border bg-background hover:bg-muted/50"
                      )}
                    >
                      <Icon className="h-5 w-5 mt-0.5 shrink-0 text-primary" />
                      <span>
                        <span className="block font-medium text-base">{opt.title}</span>
                        <span className="block text-sm text-foreground-muted mt-0.5">
                          {opt.hint}
                        </span>
                      </span>
                    </button>
                  );
                })}
              </div>
            </section>
          )}
        </div>

        {/* Sticky bottom CTA */}
        <div className="sticky bottom-0 pt-4 pb-[max(1rem,env(safe-area-inset-bottom))] mt-6 bg-gradient-to-t from-muted/20 via-muted/20 to-transparent">
          {step < TOTAL_STEPS ? (
            <Button
              type="button"
              size="lg"
              className="w-full h-12 text-base"
              onClick={goNext}
            >
              {t(m, "create.next")}
              <ChevronRight className="ml-1 h-5 w-5" />
            </Button>
          ) : (
            <Button
              type="button"
              size="lg"
              className="w-full h-12 text-base"
              disabled={loading}
              onClick={handleCreate}
            >
              {loading ? t(m, "create.submitting") : t(m, "create.submit")}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
