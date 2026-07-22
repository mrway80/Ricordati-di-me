import { notFound } from "next/navigation";
import { getMemorialBySlug, checkGuardianStatus } from "@/app/actions/memorial";
import { listMemorialPosts } from "@/app/actions/post";
import { listMemorialMedia } from "@/app/actions/media";
import { createClient } from "@/lib/supabase/server";
import { calculateAge } from "@/lib/utils";
import { MemorialStory } from "@/components/memorial/MemorialStory";
import type { Metadata } from "next";

interface MemorialPageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ onboarding?: string }>;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const result = await getMemorialBySlug(slug);
  if (!result.success || !result.data) {
    return { title: "Memoriale" };
  }
  const m = result.data;
  const name = m.nickname
    ? `${m.firstName} "${m.nickname}" ${m.lastName}`
    : `${m.firstName} ${m.lastName}`;
  return {
    title: `In ricordo di ${name}`,
    description: m.biography?.slice(0, 160) || `Un luogo per ricordare ${name}.`,
    openGraph: {
      title: `In ricordo di ${name}`,
      images: m.coverPhotoUrl || m.mainPhotoUrl ? [m.coverPhotoUrl || m.mainPhotoUrl!] : undefined,
    },
  };
}

export default async function MemorialPage({ params, searchParams }: MemorialPageProps) {
  const { slug } = await params;
  const query = await searchParams;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const result = await getMemorialBySlug(slug);

  if (!result.success || !result.data) {
    if (result.error?.code === "NOT_FOUND") {
      notFound();
    }
  }

  const memorial = result.data;

  if (!memorial) {
    notFound();
  }

  const guardianResult = await checkGuardianStatus(memorial.id);
  const isGuardian = guardianResult.success ? guardianResult.data?.isGuardian ?? false : false;

  const statusFilter: string | undefined = isGuardian ? undefined : "published";
  const mediaStatusFilter: string | undefined = isGuardian ? undefined : "approved";

  const [postsResult, mediaResult] = await Promise.all([
    listMemorialPosts(memorial.id, { status: statusFilter }),
    listMemorialMedia(memorial.id, {
      status: mediaStatusFilter,
      mediaType: "image",
    }),
  ]);

  const posts = postsResult.success ? postsResult.data?.items ?? [] : [];
  const media = mediaResult.success ? mediaResult.data?.items ?? [] : [];

  const pendingPosts: Array<Record<string, unknown>> = [];
  const pendingMedia: Array<Record<string, unknown>> = [];

  if (isGuardian) {
    const [pendingPostsResult, pendingMediaResult] = await Promise.all([
      listMemorialPosts(memorial.id, { status: "pending_family_review" }),
      listMemorialMedia(memorial.id, { status: "processing" }),
    ]);
    if (pendingPostsResult.success) {
      pendingPosts.push(
        ...(pendingPostsResult.data?.items ?? []).map(
          (p) => p as unknown as Record<string, unknown>
        )
      );
    }
    if (pendingMediaResult.success) {
      pendingMedia.push(
        ...(pendingMediaResult.data?.items ?? []).map(
          (m) => m as unknown as Record<string, unknown>
        )
      );
    }
  }

  const displayName = memorial.nickname
    ? `${memorial.firstName} "${memorial.nickname}" ${memorial.lastName}`
    : `${memorial.firstName} ${memorial.lastName}`;

  const age =
    memorial.birthDate && memorial.deathDate
      ? calculateAge(memorial.birthDate, memorial.deathDate)
      : null;

  return (
    <MemorialStory
      memorial={memorial}
      slug={slug}
      displayName={displayName}
      age={age}
      posts={posts}
      media={media}
      isGuardian={isGuardian}
      isLoggedIn={!!user}
      showOnboarding={query.onboarding === "1"}
      onboardingGaps={{
        missingPhoto: !memorial.mainPhotoUrl,
        missingDates: !memorial.birthDate || !memorial.deathDate,
        missingBio: !memorial.biography,
        missingInvite: (memorial.stats?.memberCount ?? 0) < 1,
      }}
      pendingPosts={pendingPosts}
      pendingMedia={pendingMedia}
    />
  );
}
