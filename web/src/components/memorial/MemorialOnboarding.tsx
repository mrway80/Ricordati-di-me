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
}

const STORAGE_PREFIX = "memorial-onboarding-dismissed:";

export function MemorialOnboarding({
  slug,
  gaps,
  forceShow = false,
  locale = "it",
}: MemorialOnboardingProps) {
  const m = getMessages(locale);
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
        href: `/memoriale/${slug}?tab=foto`,
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
      className="mb-8 rounded-2xl border border-primary/20 bg-primary/[0.04] p-4 sm:p-5"
      aria-labelledby="onboarding-title"
    >
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="min-w-0">
          <h2 id="onboarding-title" className="font-display text-lg font-semibold">
            {t(m, "onboarding.title")}
          </h2>
          <p className="text-sm text-foreground-muted mt-0.5">{t(m, "onboarding.subtitle")}</p>
          <p className="text-xs text-foreground-subtle mt-2">
            {t(m, "onboarding.progress", { done, total })}
          </p>
        </div>
        <button
          type="button"
          onClick={dismiss}
          className="min-h-11 min-w-11 inline-flex items-center justify-center rounded-full text-foreground-muted hover:bg-muted hover:text-foreground shrink-0"
          aria-label={t(m, "onboarding.dismiss")}
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <div
        className="h-1.5 w-full rounded-full bg-border overflow-hidden mb-4"
        role="progressbar"
        aria-valuenow={done}
        aria-valuemin={0}
        aria-valuemax={total}
      >
        <div
          className="h-full bg-primary transition-all"
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
                  "flex items-center gap-3 rounded-xl border border-border bg-background",
                  "p-3 sm:p-4 min-h-[4.5rem] hover:border-primary/30 transition-colors"
                )}
              >
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <Icon className="h-5 w-5" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block font-medium text-sm sm:text-base">{task.title}</span>
                  <span className="block text-xs sm:text-sm text-foreground-muted mt-0.5 line-clamp-2">
                    {task.hint}
                  </span>
                </span>
                <span className="text-sm font-medium text-primary shrink-0 hidden xs:inline sm:inline">
                  {task.cta}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>

      {done > 0 && (
        <p className="mt-3 flex items-center gap-1.5 text-xs text-foreground-subtle">
          <CheckCircle2 className="h-3.5 w-3.5 text-primary" />
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
