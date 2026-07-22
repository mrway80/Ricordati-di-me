"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowUpRight,
  Heart,
  Settings,
  Share2,
  Users,
} from "lucide-react";
import type { MediaAsset, MemorialWithGuardian, PostWithAuthor } from "@/types";
import { formatDate } from "@/lib/utils";
import { MemorialOnboarding, type OnboardingGaps } from "@/components/memorial/MemorialOnboarding";
import CreatePostButton from "@/app/memoriale/[slug]/CreatePostButton";
import UploadMediaButton from "@/app/memoriale/[slug]/UploadMediaButton";
import ApprovalQueue from "@/app/memoriale/[slug]/ApprovalQueue";

const NAV = [
  { id: "vita", label: "Vita" },
  { id: "affetti", label: "Affetti" },
  { id: "ricordi", label: "Ricordi" },
  { id: "momenti", label: "Momenti" },
  { id: "timeline", label: "Timeline" },
] as const;

interface MemorialStoryProps {
  memorial: MemorialWithGuardian;
  slug: string;
  displayName: string;
  age: number | null;
  posts: PostWithAuthor[];
  media: MediaAsset[];
  isGuardian: boolean;
  isLoggedIn: boolean;
  showOnboarding: boolean;
  onboardingGaps: OnboardingGaps;
  pendingPosts: Array<Record<string, unknown>>;
  pendingMedia: Array<Record<string, unknown>>;
}

export function MemorialStory({
  memorial,
  slug,
  displayName,
  age,
  posts,
  media,
  isGuardian,
  isLoggedIn,
  showOnboarding,
  onboardingGaps,
  pendingPosts,
  pendingMedia,
}: MemorialStoryProps) {
  const [active, setActive] = useState<string>("vita");
  const [navSolid, setNavSolid] = useState(false);

  const heroUrl = memorial.coverPhotoUrl || memorial.mainPhotoUrl;
  const portraitUrl = memorial.mainPhotoUrl || memorial.coverPhotoUrl;
  const firstName = memorial.firstName;
  const publishedPosts = posts.filter((p) => p.status === "published" || isGuardian);
  const approvedMedia = media.filter((m) => m.status === "approved" || isGuardian);

  useEffect(() => {
    const onScroll = () => {
      setNavSolid(window.scrollY > 48);
      const offsets = NAV.map((item) => {
        const el = document.getElementById(item.id);
        if (!el) return { id: item.id, top: Number.POSITIVE_INFINITY };
        return { id: item.id, top: Math.abs(el.getBoundingClientRect().top - 120) };
      });
      offsets.sort((a, b) => a.top - b.top);
      if (offsets[0]) setActive(offsets[0].id);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  async function shareMemorial() {
    const url = typeof window !== "undefined" ? window.location.href : "";
    try {
      if (navigator.share) {
        await navigator.share({
          title: `In ricordo di ${displayName}`,
          text: `Un luogo per ricordare ${displayName}`,
          url,
        });
        return;
      }
      await navigator.clipboard.writeText(url);
    } catch {
      // ignore cancel / clipboard failures
    }
  }

  const timeline = buildTimeline(memorial, publishedPosts, age);

  return (
    <div className="memorial-story min-h-[100dvh]">
      <header
        className="sticky top-0 z-40 transition-colors duration-300"
        style={{
          background: navSolid ? "rgba(253,250,242,0.92)" : "transparent",
          backdropFilter: navSolid ? "blur(12px)" : undefined,
          borderBottom: navSolid ? "1px solid var(--ms-border)" : "1px solid transparent",
        }}
      >
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <Link
            href="/"
            className="ms-mono text-[11px] tracking-[0.18em] uppercase text-[color:var(--ms-muted)] hover:text-[color:var(--ms-ink)]"
          >
            Ricordati di Te
          </Link>
          <nav className="hidden md:flex items-center gap-1" aria-label="Sezioni memoriale">
            {NAV.map((item) => (
              <a
                key={item.id}
                href={`#${item.id}`}
                className="ms-mono rounded-full px-3 py-2 text-[11px] tracking-[0.14em] uppercase transition-colors"
                style={{
                  color: active === item.id ? "var(--ms-ink)" : "var(--ms-muted)",
                  background: active === item.id ? "rgba(183,166,128,0.22)" : "transparent",
                }}
              >
                {item.label}
              </a>
            ))}
          </nav>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={shareMemorial}
              className="inline-flex min-h-10 items-center gap-1.5 rounded-full border border-[color:var(--ms-border)] bg-[color:var(--ms-cream)]/80 px-3 text-sm text-[color:var(--ms-ink-soft)]"
            >
              <Share2 className="h-4 w-4" />
              <span className="hidden sm:inline">Condividi</span>
            </button>
            {isGuardian && (
              <Link
                href={`/memoriale/${slug}/completa`}
                className="inline-flex min-h-10 items-center gap-1.5 rounded-full bg-[color:var(--ms-earth)] px-3 text-sm text-[color:var(--ms-cream)]"
              >
                <Settings className="h-4 w-4" />
                <span className="hidden sm:inline">Gestisci</span>
              </Link>
            )}
          </div>
        </div>
        <div className="flex gap-1 overflow-x-auto px-4 pb-3 md:hidden scrollbar-none">
          {NAV.map((item) => (
            <a
              key={item.id}
              href={`#${item.id}`}
              className="ms-mono shrink-0 rounded-full px-3 py-2 text-[11px] tracking-[0.12em] uppercase"
              style={{
                color: active === item.id ? "var(--ms-ink)" : "var(--ms-muted)",
                background: active === item.id ? "rgba(183,166,128,0.22)" : "rgba(253,250,242,0.7)",
              }}
            >
              {item.label}
            </a>
          ))}
        </div>
      </header>

      {/* Hero */}
      <section className="relative min-h-[88dvh] flex items-end overflow-hidden">
        {heroUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={heroUrl}
            alt=""
            className="absolute inset-0 h-full w-full object-cover"
          />
        ) : (
          <div
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(160deg, #6f5c46 0%, #302a20 45%, #7c8a63 120%)",
            }}
          />
        )}
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(180deg, rgba(48,42,32,0.15) 0%, rgba(48,42,32,0.35) 40%, rgba(48,42,32,0.88) 100%)",
          }}
        />
        <div className="relative z-10 w-full px-4 pb-14 pt-32 sm:px-8 sm:pb-20">
          <div className="mx-auto max-w-4xl text-center sm:text-left">
            <p className="ms-mono mb-4 text-[12px] tracking-[0.22em] uppercase text-[#d9cdb6]">
              In ricordo di
            </p>
            <h1
              className="ms-serif font-light text-[clamp(2.75rem,9vw,5.5rem)] leading-[0.95] text-[#fdfaf2]"
              style={{ letterSpacing: "-0.02em" }}
            >
              {displayName}
            </h1>
            <p className="mt-5 max-w-xl text-[15.5px] leading-relaxed text-[#d9cdb6] mx-auto sm:mx-0">
              {[
                memorial.birthDate ? formatDate(memorial.birthDate) : null,
                memorial.deathDate ? formatDate(memorial.deathDate) : null,
              ]
                .filter(Boolean)
                .join(" — ") || "Una vita da raccontare"}
              {age !== null ? ` · ${age} anni` : ""}
            </p>
            {(memorial.birthPlace || memorial.deathPlace) && (
              <p className="mt-2 text-sm text-[#c3b291]">
                {[memorial.birthPlace, memorial.deathPlace].filter(Boolean).join(" → ")}
              </p>
            )}
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3 sm:justify-start">
              <a href="#ricordi" className="ms-cta">
                <Heart className="h-4 w-4" />
                Leggi i ricordi
              </a>
              {isLoggedIn && <CreatePostButton memorialId={memorial.id} />}
            </div>
          </div>
        </div>
      </section>

      {isGuardian && (
        <div className="mx-auto max-w-3xl px-4 pt-8 sm:px-6">
          <MemorialOnboarding
            slug={slug}
            forceShow={showOnboarding}
            gaps={onboardingGaps}
            locale="it"
            variant="story"
          />
          {(pendingPosts.length > 0 || pendingMedia.length > 0) && (
            <div className="mt-6">
              <ApprovalQueue
                memorialId={memorial.id}
                slug={slug}
                pendingPosts={pendingPosts}
                pendingMedia={pendingMedia}
              />
            </div>
          )}
        </div>
      )}

      {/* Vita */}
      <section id="vita" className="ms-section scroll-mt-28">
        <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
          <div>
            <p className="ms-eyebrow">La sua vita</p>
            <h2 className="ms-serif mt-3 text-[clamp(2rem,5vw,3.4rem)] font-light leading-[1.08] text-[color:var(--ms-ink)]">
              Chi era {firstName}?
            </h2>
            {memorial.biography ? (
              <p className="mt-6 whitespace-pre-wrap text-[16.5px] leading-[1.7] text-[#6b5d4b]">
                {memorial.biography}
              </p>
            ) : (
              <p className="mt-6 text-[16.5px] leading-[1.7] text-[#6b5d4b]">
                La biografia non è ancora stata scritta.
                {isGuardian
                  ? " Aggiungi poche righe per far conoscere chi era davvero."
                  : " Torna più avanti: questa storia sta ancora prendendo forma."}
              </p>
            )}
            {isGuardian && !memorial.biography && (
              <Link
                href={`/memoriale/${slug}/completa?focus=bio`}
                className="mt-6 inline-flex items-center gap-1.5 text-sm font-medium text-[color:var(--ms-earth-mid)]"
              >
                Completa la biografia
                <ArrowUpRight className="h-4 w-4" />
              </Link>
            )}
          </div>
          <div className="relative aspect-[4/5] overflow-hidden rounded-[22px] bg-[#efe4d1]">
            {portraitUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={portraitUrl}
                alt={displayName}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full flex-col items-center justify-center gap-3 px-6 text-center">
                <span className="ms-serif text-5xl text-[color:var(--ms-gold)]">
                  {memorial.firstName.charAt(0)}
                  {memorial.lastName.charAt(0)}
                </span>
                <span className="ms-mono text-[11px] tracking-[0.16em] uppercase text-[color:var(--ms-muted)]">
                  foto grande · {firstName}
                </span>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Affetti */}
      <section
        id="affetti"
        className="ms-section scroll-mt-28"
        style={{ background: "linear-gradient(180deg,#f2ead9,#efe6d3)" }}
      >
        <div className="mx-auto max-w-6xl">
          <p className="ms-eyebrow">Gli affetti</p>
          <h2 className="ms-serif mt-3 text-[clamp(2rem,5vw,3.2rem)] font-light leading-[1.08]">
            Le persone che ha amato
          </h2>
          <p className="mt-4 max-w-2xl text-[16.5px] leading-relaxed text-[#6b5d4b]">
            Chi vuoi davvero conoscere, si conosce dalle persone che ha tenuto vicine.
          </p>

          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {memorial.guardian && (
              <article className="rounded-[18px] border border-[color:var(--ms-border)] bg-[color:var(--ms-cream)]/80 p-5">
                <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[#e8dcc8] ms-serif text-xl text-[color:var(--ms-earth)]">
                  {(memorial.guardian.displayName || memorial.guardian.fullName || "C")
                    .charAt(0)
                    .toUpperCase()}
                </div>
                <p className="ms-serif text-xl text-[color:var(--ms-ink)]">
                  {memorial.guardian.displayName || memorial.guardian.fullName || "Custode"}
                </p>
                <p className="ms-mono mt-1 text-[11px] tracking-[0.14em] uppercase text-[color:var(--ms-muted)]">
                  {memorial.guardian.relationship || "Custode"}
                </p>
              </article>
            )}

            <article className="rounded-[18px] border border-dashed border-[color:var(--ms-gold)] bg-transparent p-5 flex flex-col justify-between min-h-[11rem]">
              <div>
                <Users className="h-5 w-5 text-[color:var(--ms-olive)]" />
                <p className="ms-serif mt-3 text-xl">Famiglia e amici</p>
                <p className="mt-2 text-sm text-[#6b5d4b]">
                  {(memorial.stats?.memberCount ?? 0) > 0
                    ? `${memorial.stats?.memberCount} persone fanno parte di questo memoriale.`
                    : "Questo spazio aspetta le persone che lo hanno conosciuto."}
                </p>
              </div>
              {isGuardian && (
                <Link
                  href={`/memoriale/${slug}/membri`}
                  className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-[color:var(--ms-earth-mid)]"
                >
                  Invita qualcuno
                  <ArrowUpRight className="h-4 w-4" />
                </Link>
              )}
            </article>
          </div>
        </div>
      </section>

      {/* Ricordi */}
      <section id="ricordi" className="ms-section scroll-mt-28">
        <div className="mx-auto max-w-6xl">
          <p className="ms-eyebrow">Le voci di chi resta</p>
          <h2 className="ms-serif mt-3 text-[clamp(2rem,5vw,3.2rem)] font-light leading-[1.08]">
            I ricordi
          </h2>
          <p className="mt-4 max-w-2xl text-[16.5px] leading-relaxed text-[#6b5d4b]">
            Ogni ricordo è una pagina di diario. Insieme, raccontano quello che nessuna
            fotografia potrebbe dire da sola.
          </p>

          {publishedPosts.length === 0 ? (
            <div className="mt-10 rounded-[20px] border border-[color:var(--ms-border)] bg-[#faf6ec] px-6 py-12 text-center">
              <p className="ms-serif text-2xl text-[color:var(--ms-ink)]">
                Nessun ricordo ancora
              </p>
              <p className="mt-3 text-[#6b5d4b]">
                Sii il primo a lasciare una storia, un aneddoto, una parola.
              </p>
              {isLoggedIn && (
                <div className="mt-6 flex justify-center">
                  <CreatePostButton memorialId={memorial.id} />
                </div>
              )}
            </div>
          ) : (
            <div className="mt-10 space-y-5">
              {publishedPosts.map((post) => {
                const author =
                  post.author?.displayName || post.author?.fullName || "Qualcuno che ricorda";
                const date = post.publishedAt || post.createdAt;
                return (
                  <article
                    key={post.id}
                    className="rounded-[20px] border border-[color:var(--ms-border)] bg-[color:var(--ms-cream)] p-5 sm:p-7"
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#e8dcc8] ms-serif text-lg text-[color:var(--ms-earth)]">
                        {author.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-[color:var(--ms-ink)]">{author}</p>
                        <p className="ms-mono text-[11px] tracking-[0.12em] uppercase text-[color:var(--ms-muted)]">
                          {formatDate(date)}
                        </p>
                      </div>
                    </div>
                    {post.title && (
                      <h3 className="ms-serif mt-4 text-xl text-[color:var(--ms-ink)]">
                        {post.title}
                      </h3>
                    )}
                    <p className="mt-3 whitespace-pre-wrap text-[16px] leading-[1.7] text-[#6b5d4b]">
                      {post.content}
                    </p>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* Momenti */}
      <section
        id="momenti"
        className="ms-section scroll-mt-28"
        style={{ background: "linear-gradient(180deg,#f7f1e4,#f2ead9)" }}
      >
        <div className="mx-auto max-w-6xl">
          <p className="ms-eyebrow">Galleria</p>
          <h2 className="ms-serif mt-3 text-[clamp(2rem,5vw,3.2rem)] font-light leading-[1.08]">
            Momenti
          </h2>
          <p className="mt-4 max-w-2xl text-[16.5px] leading-relaxed text-[#6b5d4b]">
            I gesti, i luoghi, i volti: frammenti di vita che restano.
          </p>

          <div className="mt-10 grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-4">
            {(portraitUrl || heroUrl) && (
              <div className="col-span-2 row-span-2 aspect-[4/3] overflow-hidden rounded-[18px] bg-[#e8dcc8] md:aspect-auto md:min-h-[22rem]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={(portraitUrl || heroUrl)!}
                  alt=""
                  className="h-full w-full object-cover"
                />
              </div>
            )}
            {approvedMedia.length === 0 && !portraitUrl && !heroUrl && (
              <>
                {[1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className="aspect-square rounded-[18px] bg-[#e8dcc8] flex items-center justify-center"
                  >
                    <span className="ms-mono text-[10px] tracking-[0.14em] uppercase text-[color:var(--ms-muted)]">
                      momento {i}
                    </span>
                  </div>
                ))}
              </>
            )}
            {approvedMedia.slice(0, 6).map((item, idx) => (
              <div
                key={item.id}
                className="aspect-square rounded-[18px] bg-[#e8dcc8] flex items-center justify-center p-4 text-center"
              >
                <span className="ms-mono text-[10px] tracking-[0.14em] uppercase text-[color:var(--ms-muted)]">
                  {item.altText || item.originalFilename || `Foto ${idx + 1}`}
                </span>
              </div>
            ))}
          </div>

          {isLoggedIn && (
            <div className="mt-8">
              <UploadMediaButton memorialId={memorial.id} />
            </div>
          )}
        </div>
      </section>

      {/* Timeline */}
      <section id="timeline" className="ms-section scroll-mt-28">
        <div className="mx-auto max-w-3xl">
          <p className="ms-eyebrow">Nel tempo</p>
          <h2 className="ms-serif mt-3 text-[clamp(2rem,5vw,3.2rem)] font-light leading-[1.08]">
            Timeline
          </h2>
          <ol className="mt-10 space-y-0">
            {timeline.map((item, idx) => (
              <li key={`${item.label}-${idx}`} className="relative flex gap-5 pb-10 last:pb-0">
                <div className="flex flex-col items-center">
                  <span
                    className="mt-1 h-3 w-3 rounded-full"
                    style={{ background: "var(--ms-olive)" }}
                  />
                  {idx < timeline.length - 1 && (
                    <span className="mt-1 w-px flex-1 bg-[color:var(--ms-border)]" />
                  )}
                </div>
                <div className="min-w-0 pb-1">
                  <p className="ms-mono text-[11px] tracking-[0.14em] uppercase text-[color:var(--ms-muted)]">
                    {item.date}
                  </p>
                  <p className="ms-serif mt-1 text-xl text-[color:var(--ms-ink)]">{item.label}</p>
                  {item.detail && (
                    <p className="mt-1 text-sm text-[#6b5d4b]">{item.detail}</p>
                  )}
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* CTA */}
      <section className="ms-section pt-0">
        <div
          className="mx-auto max-w-4xl overflow-hidden rounded-[28px] px-6 py-12 text-center sm:px-10 sm:py-16"
          style={{
            background: "linear-gradient(145deg,#302a20 0%,#6f5c46 55%,#7c8a63 140%)",
          }}
        >
          <p className="ms-mono text-[12px] tracking-[0.2em] uppercase text-[#d9cdb6]">
            Lascia una traccia
          </p>
          <h2 className="ms-serif mt-4 text-[clamp(1.9rem,4.5vw,3rem)] font-light leading-[1.1] text-[#fdfaf2]">
            Condividi un ricordo
          </h2>
          <p className="mx-auto mt-4 max-w-lg text-[15.5px] leading-relaxed text-[#d9cdb6]">
            Una frase, un aneddoto, una foto: ogni contributo aiuta a tenere viva la sua storia.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            {isLoggedIn ? (
              <CreatePostButton memorialId={memorial.id} />
            ) : (
              <Link href="/login" className="ms-cta" style={{ background: "#fdfaf2", color: "#302a20" }}>
                Accedi per scrivere
              </Link>
            )}
            <button
              type="button"
              onClick={shareMemorial}
              className="inline-flex min-h-[3.25rem] items-center gap-2 rounded-[15px] border border-[#d9cdb6]/40 px-5 text-[#fdfaf2]"
            >
              <Share2 className="h-4 w-4" />
              Condividi il memoriale
            </button>
          </div>
        </div>
      </section>

      <footer className="border-t border-[color:var(--ms-border)] px-4 py-8 text-center">
        <p className="ms-mono text-[11px] tracking-[0.16em] uppercase text-[color:var(--ms-muted)]">
          Ricordati di Te
        </p>
      </footer>
    </div>
  );
}

function buildTimeline(
  memorial: MemorialWithGuardian,
  posts: PostWithAuthor[],
  age: number | null
) {
  const items: Array<{ date: string; label: string; detail?: string }> = [];

  if (memorial.birthDate) {
    items.push({
      date: formatDate(memorial.birthDate),
      label: "Nascita",
      detail: memorial.birthPlace || undefined,
    });
  }

  for (const post of posts.slice(0, 4)) {
    const d = post.publishedAt || post.createdAt;
    items.push({
      date: formatDate(d),
      label: post.title || "Un ricordo condiviso",
      detail: (post.author?.displayName || post.author?.fullName || undefined) ?? undefined,
    });
  }

  if (memorial.deathDate) {
    items.push({
      date: formatDate(memorial.deathDate),
      label: age !== null ? `Fine del percorso terreno · ${age} anni` : "Fine del percorso terreno",
      detail: memorial.deathPlace || undefined,
    });
  }

  if (items.length === 0) {
    items.push({
      date: "Presto",
      label: "La timeline si riempirà con date e ricordi",
    });
  }

  return items;
}
