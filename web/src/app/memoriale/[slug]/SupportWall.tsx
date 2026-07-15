"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Heart, Flame, Flower, Send, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { createClient } from "@/lib/supabase/client";
import type { ReactionType } from "@/types";

interface SupportWallProps {
  memorialId: string;
}

const reactionIcons: Record<ReactionType, React.ReactNode> = {
  candle: <Flame className="h-5 w-5" />,
  flower: <Flower className="h-5 w-5" />,
  heart: <Heart className="h-5 w-5" />,
  prayer: <Flame className="h-5 w-5" />,
  memory: <Heart className="h-5 w-5" />,
  gratitude: <Heart className="h-5 w-5" />,
};

const reactionLabels: Record<ReactionType, string> = {
  candle: "Accendi una luce",
  flower: "Lascia un fiore",
  heart: "Ti sono vicino",
  prayer: "Preghiera",
  memory: "Conservo questo ricordo",
  gratitude: "Grazie per averlo condiviso",
};

export default function SupportWall({ memorialId }: SupportWallProps) {
  const router = useRouter();
  const [content, setContent] = useState("");
  const [selectedReaction, setSelectedReaction] = useState<ReactionType | null>(null);
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit() {
    if (!content.trim() && !selectedReaction) return;

    setLoading(true);
    setError(null);

    const supabase = createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setError("Devi essere autenticato per lasciare un messaggio");
      setLoading(false);
      return;
    }

    const { error: insertError } = await supabase.from("support_messages").insert({
      memorial_id: memorialId,
      author_id: user.id,
      content: content.trim() || null,
      reaction_type: selectedReaction,
      is_anonymous: isAnonymous,
    });

    setLoading(false);

    if (insertError) {
      setError("Errore nell'invio del messaggio");
      return;
    }

    // Reset form
    setContent("");
    setSelectedReaction(null);
    setIsAnonymous(false);
    router.refresh();
  }

  return (
    <div className="space-y-6">
      {/* Compose */}
      <Card className="bg-white">
        <CardContent className="p-6 space-y-4">
          <h3 className="font-display text-lg font-semibold">Lascia un messaggio di vicinanza</h3>

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Reaction Buttons */}
          <div className="flex flex-wrap gap-2">
            {(Object.keys(reactionLabels) as ReactionType[]).map((type) => (
              <button
                key={type}
                onClick={() => setSelectedReaction(selectedReaction === type ? null : type)}
                className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-full text-sm transition-all ${
                  selectedReaction === type
                    ? "bg-primary/15 text-primary border border-primary/30"
                    : "bg-muted text-foreground-muted border border-transparent hover:bg-muted/80"
                }`}
              >
                {reactionIcons[type]}
                {reactionLabels[type]}
              </button>
            ))}
          </div>

          <Textarea
            placeholder="Scrivi un messaggio di vicinanza per la famiglia..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={3}
            maxLength={2000}
          />

          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 text-sm text-foreground-muted cursor-pointer">
              <input
                type="checkbox"
                checked={isAnonymous}
                onChange={(e) => setIsAnonymous(e.target.checked)}
                className="h-4 w-4 rounded border-border"
              />
              Invia anonimamente
            </label>

            <Button onClick={handleSubmit} disabled={loading || (!content.trim() && !selectedReaction)}>
              <Send className="mr-2 h-4 w-4" />
              {loading ? "Invio..." : "Invia"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Empty state */}
      <div className="text-center py-12">
        <Heart className="h-12 w-12 mx-auto text-border mb-4" />
        <h3 className="font-display text-lg font-medium mb-2">
          Nessun messaggio ancora
        </h3>
        <p className="text-foreground-muted max-w-sm mx-auto">
          Sii il primo a lasciare un segno di vicinanza per la famiglia.
        </p>
      </div>
    </div>
  );
}
