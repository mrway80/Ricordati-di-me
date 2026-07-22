"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Camera, Calendar, FileText, UserPlus, X, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getMessages, t, type Locale } from "@/i18n";
import { cn } from "@/lib/utils";

export interface OnboardingGaps {
  missingPhoto: boolean;
  missingDates: boolean;
  missingBio: boolean;
  missingInvite: boolean;
}

interface MemorialOnboardingProps {
  slug: string;
  gaps: OnboardingGaps;
  forceShow?: boolean;
  locale?: Locale;
  /** Soft panel styled for the public storytelling memorial page */
  variant?: "default" | "story";
}

const STORAGE_PREFIX = "memorial-onboarding-dismissed:";

export function MemorialOnboarding({
  slug,
  gaps,
  forceShow = false,
  locale = "it",
  variant = "default",
}: MemorialOnboardingProps) {
  const m = getMessages(locale);
  const story = variant === "story";
  const [dismissed, setDismissed] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_PREFIX + slug);
      if (stored === "1" && !forceShow) setDismissed(true);
    } catch {
      // ignore
    }
    setReady(true);
  }, [slug, forceShow]);

  const tasks = useMemo(() => {
    const list = [
      {
        id: "photo",
        show: gaps.missingPhoto,
        title: t(m, "onboarding.photoTitle"),
        hint: t(m, "onboarding.photoHint"),
        cta: t(m, "onboarding.photoCta"),
        href: `/memoriale/${slug}#momenti`,
        icon: Camera,
      },
      {
        id: "dates",
        show: gaps.missingDates,
        title: t(m, "onboarding.datesTitle"),
        hint: t(m, "onboarding.datesHint"),
        cta: t(m, "onboarding.datesCta"),
        href: `/memoriale/${slug}/completa?focus=dates`,
        icon: Calendar,
      },
      {
        id: "bio",
        show: gaps.missingBio,
        title: t(m, "onboarding.bioTitle"),
        hint: t(m, "onboarding.bioHint"),
        cta: t(m, "onboarding.bioCta"),
        href: `/memoriale/${slug}/completa?focus=bio`,
        icon: FileText,
      },
      {
        id: "invite",
        show: gaps.missingInvite,
        title: t(m, "onboarding.inviteTitle"),
        hint: t(m, "onboarding.inviteHint"),
        cta: t(m, "onboarding.inviteCta"),
        href: `/memoriale/${slug}/membri`,
        icon: UserPlus,
      },
    ];
    return list.filter((task) => task.show);
  }, [gaps, m, slug]);

  const total = 4;
  const done = total - tasks.length;

  function dismiss() {
    setDismissed(true);
    try {
      localStorage.setItem(STORAGE_PREFIX + slug, "1");
    } catch {
      // ignore
    }
  }

  if (!ready || dismissed || tasks.length === 0) return null;

  return (
    <section
      className={cn(
        "mb-8 rounded-2xl p-4 sm:p-5",
        story
          ? "border border-[color:var(--ms-border)] bg-[color:var(--ms-cream)]/90 shadow-[0_10px_30px_rgba(48,42,32,0.06)]"
          : "border border-primary/20 bg-primary/[0.04]"
      )}
      aria-labelledby="onboarding-title"
    >
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="min-w-0">
          <h2
            id="onboarding-title"
            className={cn(
              "font-display text-lg font-semibold",
              story && "ms-serif font-light text-[color:var(--ms-ink)] text-2xl"
            )}
          >
            {t(m, "onboarding.title")}
          </h2>
          <p
            className={cn(
              "text-sm mt-0.5",
              story ? "text-[#6b5d4b]" : "text-foreground-muted"
            )}
          >
            {t(m, "onboarding.subtitle")}
          </p>
          <p
            className={cn(
              "text-xs mt-2",
              story ? "ms-mono tracking-[0.12em] uppercase text-[color:var(--ms-muted)]" : "text-foreground-subtle"
            )}
          >
            {t(m, "onboarding.progress", { done, total })}
          </p>
        </div>
        <button
          type="button"
          onClick={dismiss}
          className={cn(
            "min-h-11 min-w-11 inline-flex items-center justify-center rounded-full shrink-0",
            story
              ? "text-[color:var(--ms-muted)] hover:bg-[#efe4d1] hover:text-[color:var(--ms-ink)]"
              : "text-foreground-muted hover:bg-muted hover:text-foreground"
          )}
          aria-label={t(m, "onboarding.dismiss")}
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <div
        className={cn(
          "h-1.5 w-full rounded-full overflow-hidden mb-4",
          story ? "bg-[#efe4d1]" : "bg-border"
        )}
        role="progressbar"
        aria-valuenow={done}
        aria-valuemin={0}
        aria-valuemax={total}
      >
        <div
          className={cn("h-full transition-all", story ? "bg-[color:var(--ms-olive)]" : "bg-primary")}
          style={{ width: `${(done / total) * 100}%` }}
        />
      </div>

      <ul className="space-y-2">
        {tasks.map((task) => {
          const Icon = task.icon;
          return (
            <li key={task.id}>
              <Link
                href={task.href}
                className={cn(
                  "flex items-center gap-3 rounded-xl p-3 sm:p-4 min-h-[4.5rem] transition-colors",
                  story
                    ? "border border-[color:var(--ms-border)] bg-[#faf6ec] hover:border-[color:var(--ms-gold)]"
                    : "border border-border bg-background hover:border-primary/30"
                )}
              >
                <span
                  className={cn(
                    "flex h-11 w-11 shrink-0 items-center justify-center rounded-full",
                    story
                      ? "bg-[#e8dcc8] text-[color:var(--ms-earth)]"
                      : "bg-primary/10 text-primary"
                  )}
                >
                  <Icon className="h-5 w-5" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block font-medium text-sm sm:text-base">{task.title}</span>
                  <span
                    className={cn(
                      "block text-xs sm:text-sm mt-0.5 line-clamp-2",
                      story ? "text-[#6b5d4b]" : "text-foreground-muted"
                    )}
                  >
                    {task.hint}
                  </span>
                </span>
                <span
                  className={cn(
                    "text-sm font-medium shrink-0 hidden sm:inline",
                    story ? "text-[color:var(--ms-earth-mid)]" : "text-primary"
                  )}
                >
                  {task.cta}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>

      {done > 0 && (
        <p
          className={cn(
            "mt-3 flex items-center gap-1.5 text-xs",
            story ? "text-[color:var(--ms-muted)]" : "text-foreground-subtle"
          )}
        >
          <CheckCircle2
            className={cn("h-3.5 w-3.5", story ? "text-[color:var(--ms-olive)]" : "text-primary")}
          />
          {t(m, "onboarding.progress", { done, total })}
        </p>
      )}

      <Button
        type="button"
        variant="ghost"
        className="mt-3 w-full sm:w-auto min-h-11"
        onClick={dismiss}
      >
        {t(m, "onboarding.dismiss")}
      </Button>
    </section>
  );
}
