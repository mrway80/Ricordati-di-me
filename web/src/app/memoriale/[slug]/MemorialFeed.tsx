"use client";

import { useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { it } from "date-fns/locale";
import { FileText, Clock, CheckCircle, XCircle, Pin } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { approvePost, rejectPost } from "@/app/actions/post";
import type { PostWithAuthor } from "@/types";

interface MemorialFeedProps {
  posts: PostWithAuthor[];
  isGuardian: boolean;
  memorialId: string;
}

export default function MemorialFeed({ posts, isGuardian }: MemorialFeedProps) {
  const [localPosts, setLocalPosts] = useState<PostWithAuthor[]>(posts);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  async function handleApprove(postId: string) {
    setActionLoading(postId);
    const result = await approvePost(postId);
    setActionLoading(null);

    if (result.success) {
      setLocalPosts((prev) =>
        prev.map((p) => (p.id === postId ? { ...p, status: "published" } : p))
      );
    }
  }

  async function handleReject(postId: string) {
    setActionLoading(postId);
    const result = await rejectPost(postId, "Contenuto non appropriato per il memoriale");
    setActionLoading(null);

    if (result.success) {
      setLocalPosts((prev) =>
        prev.map((p) => (p.id === postId ? { ...p, status: "rejected" } : p))
      );
    }
  }

  if (localPosts.length === 0) {
    return (
      <div className="text-center py-16">
        <FileText className="h-12 w-12 mx-auto text-border mb-4" />
        <h3 className="font-display text-lg font-medium mb-2">Nessun ricordo ancora</h3>
        <p className="text-foreground-muted max-w-sm mx-auto">
          I ricordi condivisi appariranno qui. Sii il primo a contribuire.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {localPosts.map((post) => (
        <PostCard
          key={post.id}
          post={post}
          isGuardian={isGuardian}
          onApprove={handleApprove}
          onReject={handleReject}
          actionLoading={actionLoading === post.id}
        />
      ))}
    </div>
  );
}

const statusMap: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline"; icon: React.ReactNode }> = {
  published: { label: "Pubblicato", variant: "default", icon: <CheckCircle className="h-3 w-3" /> },
  pending_family_review: { label: "In approvazione", variant: "secondary", icon: <Clock className="h-3 w-3" /> },
  rejected: { label: "Rifiutato", variant: "destructive", icon: <XCircle className="h-3 w-3" /> },
  draft: { label: "Bozza", variant: "outline", icon: <FileText className="h-3 w-3" /> },
};

function PostCard({
  post,
  isGuardian,
  onApprove,
  onReject,
  actionLoading,
}: {
  post: PostWithAuthor;
  isGuardian: boolean;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
  actionLoading: boolean;
}) {
  const authorName = post.author?.displayName || post.author?.fullName || "Anonimo";
  const timeAgo = post.createdAt
    ? formatDistanceToNow(new Date(post.createdAt), { addSuffix: true, locale: it })
    : "";

  const status = statusMap[post.status] ?? statusMap.draft;

  return (
    <Card className={`bg-white ${post.isPinned ? "ring-1 ring-primary/30" : ""}`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            {post.author?.avatarUrl ? (
              <img
                src={post.author.avatarUrl}
                alt={authorName}
                className="h-10 w-10 rounded-full object-cover ring-2 ring-border"
              />
            ) : (
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-medium text-sm ring-2 ring-border">
                {authorName.charAt(0).toUpperCase()}
              </div>
            )}
            <div>
              <p className="font-medium text-sm">{authorName}</p>
              <p className="text-xs text-foreground-subtle">{timeAgo}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {post.isPinned && (
              <Badge variant="outline" className="text-primary border-primary/30 gap-1">
                <Pin className="h-3 w-3" />
                Fissato
              </Badge>
            )}
            <Badge variant={status?.variant ?? "outline"} className="gap-1 text-xs">
              {status?.icon}
              {status?.label}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {post.title && <h3 className="font-display text-lg font-semibold">{post.title}</h3>}
        <div className="text-foreground-muted leading-relaxed whitespace-pre-wrap">
          {post.content}
        </div>

        <div className="flex items-center gap-4 pt-2 text-sm text-foreground-subtle">
          <span>{post.reactionCount} reazioni</span>
          <span>{post.commentCount} commenti</span>
        </div>

        {isGuardian && post.status === "pending_family_review" && (
          <div className="flex gap-2 pt-3 border-t border-border/50">
            <Button
              size="sm"
              onClick={() => onApprove(post.id)}
              disabled={actionLoading}
              className="gap-1.5"
            >
              <CheckCircle className="h-4 w-4" />
              {actionLoading ? "..." : "Approva"}
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => onReject(post.id)}
              disabled={actionLoading}
              className="gap-1.5"
            >
              <XCircle className="h-4 w-4" />
              Rifiuta
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
