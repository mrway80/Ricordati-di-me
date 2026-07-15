import { redirect } from "next/navigation";
import Link from "next/link";
import { Users, FileText, Clock, Heart, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";

export default async function DashboardPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?redirect=/dashboard");
  }

  // Get user's profile
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  // Get memorials where user is guardian
  const { data: guardianships } = await supabase
    .from("memorial_guardians")
    .select(
      `
      id, role, relationship, memorial_id,
      memorials:memorial_id (id, slug, first_name, last_name, nickname, main_photo_url, status, visibility, created_at)
    `
    )
    .eq("profile_id", user.id)
    .eq("is_active", true)
    .order("created_at", { ascending: false });

  // Get memorials where user is member
  const { data: memberships } = await supabase
    .from("memorial_members")
    .select(
      `
      id, role, status,
      memorials:memorial_id (id, slug, first_name, last_name, nickname, main_photo_url, status, visibility)
    `
    )
    .eq("profile_id", user.id)
    .eq("status", "approved");

  // Get pending invitations
  const { data: invitations } = await supabase
    .from("memorial_invitations")
    .select("*")
    .eq("invited_email", user.email)
    .eq("status", "pending");

  const guardianMemorials = guardianships ?? [];
  const memberMemorials = memberships ?? [];
  const pendingInvitations = invitations ?? [];

  return (
    <div className="min-h-screen bg-muted/20">
      <div className="content-section py-8 sm:py-12">
        <div className="max-w-5xl mx-auto space-y-8">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="font-display text-3xl font-semibold">
                Ciao, {profile?.display_name || profile?.full_name || "Utente"}
              </h1>
              <p className="text-foreground-muted mt-1">
                Gestisci i memoriali e le tue attivita
              </p>
            </div>
            <Button >
              <Link href="/memoriale/crea">
                <Plus className="mr-2 h-4 w-4" />
                Nuovo memoriale
              </Link>
            </Button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <StatCard
              icon={<Heart className="h-5 w-5" />}
              label="Memoriali custoditi"
              value={guardianMemorials.length}
            />
            <StatCard
              icon={<Users className="h-5 w-5" />}
              label="Memoriali seguiti"
              value={memberMemorials.length}
            />
            <StatCard
              icon={<FileText className="h-5 w-5" />}
              label="Inviti in attesa"
              value={pendingInvitations.length}
            />
            <StatCard
              icon={<Clock className="h-5 w-5" />}
              label="Attivita recenti"
              value="—"
            />
          </div>

          {/* My Memorials */}
          <section className="space-y-4">
            <h2 className="font-display text-xl font-semibold flex items-center gap-2">
              <Heart className="h-5 w-5 text-primary" />
              I tuoi memoriali
            </h2>

            {guardianMemorials.length === 0 ? (
              <Card className="bg-white">
                <CardContent className="py-12 text-center">
                  <Heart className="h-12 w-12 mx-auto text-border mb-4" />
                  <h3 className="font-display text-lg font-medium mb-2">
                    Non hai ancora creato un memoriale
                  </h3>
                  <p className="text-foreground-muted mb-6 max-w-sm mx-auto">
                    Crea il primo memoriale per iniziare a custodire i ricordi di una persona
                    speciale.
                  </p>
                  <Button >
                    <Link href="/memoriale/crea">
                      <Plus className="mr-2 h-4 w-4" />
                      Crea memoriale
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {guardianMemorials.map((g) => {
                  const m = g.memorials as Array<Record<string, unknown>> | null;
                  const memorial = Array.isArray(m) ? m[0] : (m as Record<string, unknown> | null);
                  if (!memorial) return null;
                  return (
                    <MemorialCard
                      key={g.id as string}
                      slug={(memorial.slug as string) ?? ""}
                      firstName={(memorial.first_name as string) ?? ""}
                      lastName={(memorial.last_name as string) ?? ""}
                      nickname={(memorial.nickname as string | null) ?? null}
                      photoUrl={(memorial.main_photo_url as string | null) ?? null}
                      role={g.role as string}
                      relationship={g.relationship as string}
                    />
                  );
                })}
              </div>
            )}
          </section>

          {/* Followed Memorials */}
          {memberMemorials.length > 0 && (
            <section className="space-y-4">
              <h2 className="font-display text-xl font-semibold flex items-center gap-2">
                <Users className="h-5 w-5 text-secondary" />
                Memoriali che segui
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {memberMemorials.map((m) => {
                  const mem = m.memorials as Array<Record<string, unknown>> | null;
                  const memorial = Array.isArray(mem) ? mem[0] : (mem as Record<string, unknown> | null);
                  if (!memorial) return null;
                  return (
                    <MemorialCard
                      key={m.id as string}
                      slug={(memorial.slug as string) ?? ""}
                      firstName={(memorial.first_name as string) ?? ""}
                      lastName={(memorial.last_name as string) ?? ""}
                      nickname={(memorial.nickname as string | null) ?? null}
                      photoUrl={(memorial.main_photo_url as string | null) ?? null}
                      role={m.role as string}
                      relationship={null}
                    />
                  );
                })}
              </div>
            </section>
          )}

          {/* Pending Invitations */}
          {pendingInvitations.length > 0 && (
            <section className="space-y-4">
              <h2 className="font-display text-xl font-semibold">Inviti in attesa</h2>
              <div className="space-y-3">
                {pendingInvitations.map((inv) => (
                  <Card key={inv.id} className="bg-warning-light/30 border-warning/20">
                    <CardContent className="py-4 flex items-center justify-between">
                      <div>
                        <p className="font-medium">
                          Invito a partecipare al memoriale di {inv.memorial_name || "una persona cara"}
                        </p>
                        <p className="text-sm text-foreground-muted">
                          Ruolo: {inv.role as string}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline">
                          Rifiuta
                        </Button>
                        <Button size="sm">Accetta</Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: number | string;
}) {
  return (
    <Card className="bg-white">
      <CardContent className="pt-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
            {icon}
          </div>
          <div>
            <p className="text-2xl font-display font-semibold">{value}</p>
            <p className="text-sm text-foreground-muted">{label}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function MemorialCard({
  slug,
  firstName,
  lastName,
  nickname,
  photoUrl,
  role,
  relationship,
}: {
  slug: string;
  firstName: string;
  lastName: string;
  nickname: string | null;
  photoUrl: string | null;
  role: string;
  relationship: string | null;
}) {
  const displayName = nickname
    ? `${firstName} "${nickname}" ${lastName}`
    : `${firstName} ${lastName}`;

  return (
    <Link href={`/memoriale/${slug}`}>
      <Card className="bg-white hover:shadow-medium transition-shadow cursor-pointer group">
        <CardContent className="p-5">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0">
              {photoUrl ? (
                <img
                  src={photoUrl}
                  alt={displayName}
                  className="h-16 w-16 rounded-full object-cover ring-2 ring-border group-hover:ring-primary/30 transition-all"
                />
              ) : (
                <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center text-primary font-display text-xl font-semibold ring-2 ring-border">
                  {firstName.charAt(0)}
                  {lastName.charAt(0)}
                </div>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="font-display text-lg font-semibold truncate group-hover:text-primary transition-colors">
                {displayName}
              </h3>
              <div className="flex items-center gap-2 mt-1.5">
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary capitalize">
                  {role === "guardian" ? "Custode" : role === "co_guardian" ? "Co-Custode" : role}
                </span>
                {relationship && (
                  <span className="text-xs text-foreground-muted">{relationship}</span>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
