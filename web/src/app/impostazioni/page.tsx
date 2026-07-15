import { redirect } from "next/navigation";
import Link from "next/link";
import { Settings } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default async function ImpostazioniPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?redirect=/impostazioni");
  }

  const { data: preferences } = await supabase
    .from("user_preferences")
    .select("language, timezone, theme, digest_frequency")
    .eq("user_id", user.id)
    .maybeSingle();

  return (
    <div className="min-h-screen bg-muted/20">
      <div className="content-section py-8 sm:py-12">
        <div className="mx-auto max-w-xl space-y-6">
          <div>
            <h1 className="font-display text-3xl font-semibold flex items-center gap-3">
              <Settings className="h-7 w-7 text-primary" />
              Impostazioni
            </h1>
            <p className="text-foreground-muted mt-2">
              Preferenze account e notifiche.
            </p>
          </div>

          <Card className="bg-white">
            <CardContent className="space-y-4 py-6">
              <div>
                <p className="text-xs uppercase tracking-wide text-foreground-subtle">Lingua</p>
                <p className="font-medium">{preferences?.language || "it"}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-foreground-subtle">Fuso orario</p>
                <p className="font-medium">{preferences?.timezone || "Europe/Rome"}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-foreground-subtle">Tema</p>
                <p className="font-medium capitalize">{preferences?.theme || "system"}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-foreground-subtle">
                  Digest email
                </p>
                <p className="font-medium capitalize">
                  {preferences?.digest_frequency || "weekly"}
                </p>
              </div>
            </CardContent>
          </Card>

          <p className="text-sm text-foreground-muted">
            La modifica avanzata delle preferenze arrivera a breve. Per ora puoi gestire password e
            sicurezza dal tuo account.
          </p>

          <div className="flex gap-3">
            <Button variant="outline">
              <Link href="/profilo">Torna al profilo</Link>
            </Button>
            <Button variant="outline">
              <Link href="/recupero-password">Cambia password</Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
