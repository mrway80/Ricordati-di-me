import { notFound, redirect } from "next/navigation";
import { Suspense } from "react";
import { getMemorialBySlug, checkGuardianStatus } from "@/app/actions/memorial";
import { CompletaMemorialForm } from "@/components/memorial/CompletaMemorialForm";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function CompletaMemorialPage({ params }: PageProps) {
  const { slug } = await params;
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
    <Suspense fallback={<div className="p-8 text-center text-sm text-foreground-muted">…</div>}>
      <CompletaMemorialForm
        memorialId={memorial.id}
        slug={slug}
        initialBirthDate={memorial.birthDate}
        initialDeathDate={memorial.deathDate}
        initialBirthPlace={memorial.birthPlace}
        initialDeathPlace={memorial.deathPlace}
        initialBiography={memorial.biography}
        locale="it"
      />
    </Suspense>
  );
}
