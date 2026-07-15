import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ChevronLeft, UserPlus } from "lucide-react";
import { getMemorialBySlug, checkGuardianStatus } from "@/app/actions/memorial";
import { Button } from "@/components/ui/button";
import { getMessages, t } from "@/i18n";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function MembriPage({ params }: PageProps) {
  const { slug } = await params;
  const m = getMessages("it");
  const result = await getMemorialBySlug(slug);

  if (!result.success || !result.data) {
    notFound();
  }

  const memorial = result.data;
  const guardian = await checkGuardianStatus(memorial.id);
  const isGuardian = guardian.success ? guardian.data?.isGuardian : false;

  if (!isGuardian) {
    redirect(`/memoriale/${slug}`);
  }

  return (
    <div className="min-h-[100dvh] bg-muted/20">
      <div className="content-section max-w-lg mx-auto px-4 py-4 sm:py-8 space-y-6">
        <Link
          href={`/memoriale/${slug}`}
          className="inline-flex items-center gap-1 min-h-11 -ml-2 px-2 text-sm text-foreground-muted"
        >
          <ChevronLeft className="h-5 w-5" />
          {t(m, "create.back")}
        </Link>

        <div className="space-y-2">
          <h1 className="font-display text-2xl font-semibold flex items-center gap-2">
            <UserPlus className="h-6 w-6 text-primary" />
            {t(m, "onboarding.inviteTitle")}
          </h1>
          <p className="text-foreground-muted text-sm sm:text-base">
            {t(m, "onboarding.inviteHint")}
          </p>
        </div>

        <div className="rounded-2xl border bg-background p-5 space-y-3">
          <p className="text-sm text-foreground-muted">
            Gli inviti via email arriveranno a breve. Per ora puoi condividere il link del
            memoriale con chi vuoi coinvolgere.
          </p>
          <code className="block break-all rounded-lg bg-muted px-3 py-2 text-xs sm:text-sm">
            /memoriale/{slug}
          </code>
          <Button className="w-full h-12" disabled>
            {t(m, "onboarding.inviteCta")} (presto)
          </Button>
        </div>
      </div>
    </div>
  );
}
