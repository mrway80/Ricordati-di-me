"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { FileText, X, Send, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { createPost } from "@/app/actions/post";

interface CreatePostButtonProps {
  memorialId: string;
}

export default function CreatePostButton({ memorialId }: CreatePostButtonProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);

    const result = await createPost({
      memorialId,
      title: (formData.get("title") as string) || undefined,
      content: formData.get("content") as string,
      status: "pending_family_review",
    });

    setLoading(false);

    if (!result.success) {
      setError(result.error?.message ?? "Errore nella creazione del ricordo");
      return;
    }

    setIsOpen(false);
    router.refresh();
  }

  if (!isOpen) {
    return (
      <Button size="sm" onClick={() => setIsOpen(true)}>
        <FileText className="mr-1.5 h-4 w-4" />
        Scrivi un ricordo
      </Button>
    );
  }

  return (
    <Card className="w-full sm:w-auto bg-white">
      <CardContent className="p-4 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-display text-sm font-semibold">Condividi un ricordo</h3>
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => setIsOpen(false)}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="post-title" className="text-xs">
              Titolo (opzionale)
            </Label>
            <Input
              id="post-title"
              name="title"
              placeholder="Un titolo per il tuo ricordo"
              maxLength={300}
              className="text-sm"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="post-content" className="text-xs">
              Il tuo ricordo *
            </Label>
            <Textarea
              id="post-content"
              name="content"
              placeholder="Racconta un ricordo, un momento speciale, una caratteristica che ti manca..."
              required
              rows={4}
              maxLength={50000}
              className="text-sm resize-vertical"
            />
          </div>

          <div className="flex items-center justify-between pt-1">
            <p className="text-xs text-foreground-subtle">
              Il contenuto sara sottoposto all&apos;approvazione del custode.
            </p>
            <Button type="submit" size="sm" disabled={loading}>
              <Send className="mr-1.5 h-4 w-4" />
              {loading ? "Invio..." : "Invia"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
