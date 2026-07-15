import { redirect } from "next/navigation";
import { Bell } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent } from "@/components/ui/card";

export default async function NotifichePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?redirect=/notifiche");
  }

  const { data: notifications } = await supabase
    .from("notifications")
    .select("id, title, body, is_read, created_at, action_url")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(50);

  const items = notifications ?? [];

  return (
    <div className="min-h-screen bg-muted/20">
      <div className="content-section py-8 sm:py-12">
        <div className="mx-auto max-w-2xl space-y-6">
          <div>
            <h1 className="font-display text-3xl font-semibold flex items-center gap-3">
              <Bell className="h-7 w-7 text-primary" />
              Notifiche
            </h1>
            <p className="text-foreground-muted mt-2">
              Aggiornamenti sui memoriali e sull&apos;attivita della community.
            </p>
          </div>

          {items.length === 0 ? (
            <Card className="bg-white">
              <CardContent className="py-12 text-center">
                <Bell className="mx-auto mb-4 h-10 w-10 text-border" />
                <p className="font-medium">Nessuna notifica</p>
                <p className="mt-1 text-sm text-foreground-muted">
                  Quando ci saranno aggiornamenti, li vedrai qui.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {items.map((n) => (
                <Card key={n.id} className={n.is_read ? "bg-white" : "bg-primary/5 border-primary/20"}>
                  <CardContent className="py-4">
                    <p className="font-medium">{n.title}</p>
                    <p className="mt-1 text-sm text-foreground-muted">{n.body}</p>
                    <p className="mt-2 text-xs text-foreground-subtle">
                      {new Date(n.created_at as string).toLocaleString("it-IT")}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
