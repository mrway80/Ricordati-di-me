import { notFound } from "next/navigation";
import Link from "next/link";
import {
  Heart,
  Calendar,
  MapPin,
  Users,
  Image as ImageIcon,
  FileText,
  Shield,
  Settings,
  MessageCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getMemorialBySlug, checkGuardianStatus } from "@/app/actions/memorial";
import { listMemorialPosts } from "@/app/actions/post";
import { listMemorialMedia } from "@/app/actions/media";
import { createClient } from "@/lib/supabase/server";
import { calculateAge, formatDate } from "@/lib/utils";
import { MemorialOnboarding } from "@/components/memorial/MemorialOnboarding";
import MemorialFeed from "./MemorialFeed";
import MediaGallery from "./MediaGallery";
import SupportWall from "./SupportWall";
import UploadMediaButton from "./UploadMediaButton";
import CreatePostButton from "./CreatePostButton";
import ApprovalQueue from "./ApprovalQueue";

interface MemorialPageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ onboarding?: string; tab?: string }>;
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

  const defaultTab = query.tab === "foto" ? "foto" : "feed";

  return (
    <div className="min-h-screen bg-background">
      <div className="relative w-full h-40 sm:h-64 lg:h-80 bg-gradient-to-b from-primary/20 to-primary/5 overflow-hidden">
        {memorial.coverPhotoUrl ? (
          <img
            src={memorial.coverPhotoUrl}
            alt={`Copertina di ${displayName}`}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-primary/10 via-secondary/10 to-accent/10" />
        )}
        {isGuardian && (
          <div className="absolute top-3 right-3 sm:top-4 sm:right-4">
            <Button size="sm" variant="secondary" className="bg-white/90 backdrop-blur-sm min-h-10">
              <Link href={`/memoriale/${slug}/completa`}>
                <Settings className="mr-1.5 h-4 w-4" />
                Gestisci
              </Link>
            </Button>
          </div>
        )}
      </div>

      <div className="content-section -mt-14 sm:-mt-20 relative z-10 pb-16 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex flex-col sm:flex-row items-start gap-4 sm:gap-6 mb-6 sm:mb-8">
            <div className="flex-shrink-0">
              {memorial.mainPhotoUrl ? (
                <img
                  src={memorial.mainPhotoUrl}
                  alt={displayName}
                  className="h-24 w-24 sm:h-36 sm:w-36 rounded-2xl object-cover ring-4 ring-background shadow-lifted"
                />
              ) : (
                <div className="h-24 w-24 sm:h-36 sm:w-36 rounded-2xl bg-primary/10 flex items-center justify-center text-primary font-display text-3xl sm:text-4xl font-semibold ring-4 ring-background shadow-lifted">
                  {memorial.firstName.charAt(0)}
                  {memorial.lastName.charAt(0)}
                </div>
              )}
            </div>

            <div className="flex-1 min-w-0 pt-1 sm:pt-2">
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <h1 className="font-display text-xl sm:text-3xl font-semibold">{displayName}</h1>
                <Badge variant="secondary" className="capitalize text-xs">
                  {memorial.visibility === "public"
                    ? "Pubblico"
                    : memorial.visibility === "private"
                      ? "Privato"
                      : "Su invito"}
                </Badge>
              </div>

              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-foreground-muted">
                {memorial.birthDate && (
                  <span className="flex items-center gap-1.5">
                    <Calendar className="h-3.5 w-3.5" />
                    {formatDate(memorial.birthDate)}
                    {memorial.birthPlace && (
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {memorial.birthPlace}
                      </span>
                    )}
                  </span>
                )}
              </div>

              {memorial.deathDate && (
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-foreground-muted mt-1">
                  <span className="flex items-center gap-1.5">
                    <Calendar className="h-3.5 w-3.5" />
                    {formatDate(memorial.deathDate)}
                    {age !== null && <span className="text-foreground-subtle">({age} anni)</span>}
                    {memorial.deathPlace && (
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {memorial.deathPlace}
                      </span>
                    )}
                  </span>
                </div>
              )}

              {memorial.guardian && (
                <div className="flex items-center gap-2 mt-3 text-sm">
                  <Shield className="h-4 w-4 text-primary" />
                  <span className="text-foreground-muted">
                    Custode:{" "}
                    <span className="text-foreground font-medium">
                      {memorial.guardian.displayName || memorial.guardian.fullName || "Anonimo"}
                    </span>
                    {memorial.guardian.relationship && (
                      <span className="text-foreground-subtle">
                        {" "}
                        — {memorial.guardian.relationship}
                      </span>
                    )}
                  </span>
                </div>
              )}

              <div className="flex flex-wrap items-center gap-2 sm:gap-4 mt-4">
                <StatBadge
                  icon={<Users className="h-4 w-4" />}
                  value={memorial.stats?.memberCount ?? 0}
                  label="persone"
                />
                <StatBadge
                  icon={<FileText className="h-4 w-4" />}
                  value={memorial.stats?.postCount ?? 0}
                  label="ricordi"
                />
                <StatBadge
                  icon={<ImageIcon className="h-4 w-4" />}
                  value={memorial.stats?.photoCount ?? 0}
                  label="foto"
                />
                <StatBadge
                  icon={<Heart className="h-4 w-4" />}
                  value={memorial.stats?.supportMessageCount ?? 0}
                  label="messaggi"
                />
              </div>
            </div>
          </div>

          {isGuardian && (
            <MemorialOnboarding
              slug={slug}
              forceShow={query.onboarding === "1"}
              gaps={{
                missingPhoto: !memorial.mainPhotoUrl,
                missingDates: !memorial.birthDate || !memorial.deathDate,
                missingBio: !memorial.biography,
                missingInvite: (memorial.stats?.memberCount ?? 0) < 1,
              }}
              locale="it"
            />
          )}

          {memorial.biography && (
            <Card className="mb-8 bg-white">
              <CardContent className="p-5 sm:p-6">
                <h2 className="font-display text-lg font-semibold mb-3">Biografia</h2>
                <div className="prose prose-stone max-w-none text-foreground-muted leading-relaxed whitespace-pre-wrap">
                  {memorial.biography}
                </div>
              </CardContent>
            </Card>
          )}

          {isGuardian && (pendingPosts.length > 0 || pendingMedia.length > 0) && (
            <div className="mb-8">
              <ApprovalQueue
                memorialId={memorial.id}
                slug={slug}
                pendingPosts={pendingPosts}
                pendingMedia={pendingMedia}
              />
            </div>
          )}

          <div className="flex flex-wrap gap-2 sm:gap-3 mb-6 sm:mb-8">
            {user && (
              <>
                <CreatePostButton memorialId={memorial.id} />
                <UploadMediaButton memorialId={memorial.id} />
              </>
            )}
            <Button variant="outline" size="sm" className="min-h-10">
              <Link href={`/memoriale/${slug}/membri`}>
                <Users className="mr-1.5 h-4 w-4" />
                Persone
              </Link>
            </Button>
          </div>

          <Tabs defaultValue={defaultTab} className="space-y-6">
            <TabsList className="bg-white border w-full sm:w-auto justify-start overflow-x-auto">
              <TabsTrigger value="feed" className="gap-1.5 min-h-10">
                <FileText className="h-4 w-4" />
                Ricordi
              </TabsTrigger>
              <TabsTrigger value="foto" className="gap-1.5 min-h-10">
                <ImageIcon className="h-4 w-4" />
                Foto
              </TabsTrigger>
              <TabsTrigger value="vicinanza" className="gap-1.5 min-h-10">
                <MessageCircle className="h-4 w-4" />
                <span className="hidden sm:inline">Messaggi di vicinanza</span>
                <span className="sm:hidden">Vicinanza</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="feed" className="space-y-4">
              <MemorialFeed posts={posts} isGuardian={isGuardian} memorialId={memorial.id} />
            </TabsContent>

            <TabsContent value="foto">
              <MediaGallery media={media} memorialId={memorial.id} isGuardian={isGuardian} />
            </TabsContent>

            <TabsContent value="vicinanza">
              <SupportWall memorialId={memorial.id} />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}

function StatBadge({
  icon,
  value,
  label,
}: {
  icon: React.ReactNode;
  value: number;
  label: string;
}) {
  return (
    <div className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-full bg-muted text-xs sm:text-sm">
      <span className="text-foreground-subtle">{icon}</span>
      <span className="font-medium">{value}</span>
      <span className="text-foreground-subtle">{label}</span>
    </div>
  );
}
