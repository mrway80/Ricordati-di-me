import { redirect } from "next/navigation";
import Link from "next/link";
import { User } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default async function ProfiloPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?redirect=/profilo");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("username, display_name, email, bio, avatar_url, created_at")
    .eq("id", user.id)
    .single();

  return (
    <div className="min-h-screen bg-muted/20">
      <div className="content-section py-8 sm:py-12">
        <div className="mx-auto max-w-xl space-y-6">
          <div>
            <h1 className="font-display text-3xl font-semibold flex items-center gap-3">
              <User className="h-7 w-7 text-primary" />
              Il tuo profilo
            </h1>
            <p className="text-foreground-muted mt-2">
              Informazioni del tuo account su Ricordati di Te.
            </p>
          </div>

          <Card className="bg-white">
            <CardContent className="space-y-4 py-6">
              <div>
                <p className="text-xs uppercase tracking-wide text-foreground-subtle">Nome</p>
                <p className="font-medium">{profile?.display_name || "—"}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-foreground-subtle">Username</p>
                <p className="font-medium">@{profile?.username || "—"}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-foreground-subtle">Email</p>
                <p className="font-medium">{profile?.email || user.email}</p>
              </div>
              {profile?.bio && (
                <div>
                  <p className="text-xs uppercase tracking-wide text-foreground-subtle">Bio</p>
                  <p className="text-foreground-muted">{profile.bio}</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Button variant="outline">
            <Link href="/impostazioni">Modifica impostazioni</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
