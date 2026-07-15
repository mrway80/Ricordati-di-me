"use client";

import { useState } from "react";
import { CheckCircle, XCircle, Clock, FileText, Image } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { approvePost, rejectPost } from "@/app/actions/post";
import { approveMedia, rejectMedia } from "@/app/actions/media";
import { formatFileSize } from "@/lib/utils";

interface ApprovalQueueProps {
  memorialId: string;
  slug: string;
  pendingPosts: Array<Record<string, unknown>>;
  pendingMedia: Array<Record<string, unknown>>;
}

export default function ApprovalQueue({
  memorialId,
  pendingPosts,
  pendingMedia,
}: ApprovalQueueProps) {
  const [posts, setPosts] = useState<Record<string, unknown>[]>(pendingPosts);
  const [media, setMedia] = useState<Record<string, unknown>[]>(pendingMedia);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const totalPending = posts.length + media.length;

  async function handleApprovePost(postId: string) {
    setActionLoading(postId);
    const result = await approvePost(postId);
    setActionLoading(null);
    if (result.success) {
      setPosts((prev) => prev.filter((p) => p.id !== postId));
    }
  }

  async function handleRejectPost(postId: string) {
    setActionLoading(postId);
    await rejectPost(postId, "Contenuto non adatto al memoriale");
    setActionLoading(null);
    setPosts((prev) => prev.filter((p) => p.id !== postId));
  }

  async function handleApproveMedia(mediaId: string) {
    setActionLoading(mediaId);
    const result = await approveMedia(mediaId, memorialId);
    setActionLoading(null);
    if (result.success) {
      setMedia((prev) => prev.filter((m) => m.id !== mediaId));
    }
  }

  async function handleRejectMedia(mediaId: string) {
    setActionLoading(mediaId);
    await rejectMedia(mediaId, "Contenuto non adatto");
    setActionLoading(null);
    setMedia((prev) => prev.filter((m) => m.id !== mediaId));
  }

  if (totalPending === 0) return null;

  return (
    <Card className="border-warning/30 bg-warning-light/10">
      <CardHeader className="pb-3">
        <CardTitle className="font-display text-base flex items-center gap-2">
          <Clock className="h-5 w-5 text-warning" />
          Coda di approvazione
          <Badge variant="secondary" className="ml-1">
            {totalPending}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Pending Posts */}
        {posts.length > 0 && (
          <div className="space-y-3">
            <h4 className="text-sm font-medium flex items-center gap-1.5">
              <FileText className="h-4 w-4 text-foreground-subtle" />
              Ricordi in attesa ({posts.length})
            </h4>
            {posts.map((post) => (
              <div
                key={post.id as string}
                className="flex items-start justify-between gap-3 p-3 rounded-lg bg-white border"
              >
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-sm truncate">
                    {(post.title as string) || "Ricordo senza titolo"}
                  </p>
                  <p className="text-xs text-foreground-subtle mt-0.5 line-clamp-2">
                    {post.content as string}
                  </p>
                  <p className="text-xs text-foreground-subtle mt-1">
                    Autore: {((post.author as Record<string, unknown>)?.displayName || (post.author as Record<string, unknown>)?.fullName || "Anonimo") as string}
                  </p>
                </div>
                <div className="flex gap-1.5 flex-shrink-0">
                  <Button
                    size="sm"
                    className="h-8 px-2.5"
                    onClick={() => handleApprovePost(post.id as string)}
                    disabled={actionLoading === post.id}
                  >
                    <CheckCircle className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-8 px-2.5"
                    onClick={() => handleRejectPost(post.id as string)}
                    disabled={actionLoading === post.id}
                  >
                    <XCircle className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        {posts.length > 0 && media.length > 0 && <Separator />}

        {/* Pending Media */}
        {media.length > 0 && (
          <div className="space-y-3">
            <h4 className="text-sm font-medium flex items-center gap-1.5">
              <Image className="h-4 w-4 text-foreground-subtle" />
              Foto in quarantena ({media.length})
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {media.map((item) => (
                <div key={item.id as string} className="relative group">
                  <div className="aspect-square rounded-lg overflow-hidden bg-muted border">
                    <div className="w-full h-full flex items-center justify-center">
                      <Image className="h-8 w-8 text-foreground-subtle" />
                    </div>
                  </div>
                  <div className="mt-1">
                    <p className="text-xs truncate">{item.original_filename as string}</p>
                    <p className="text-[10px] text-foreground-subtle">
                      {formatFileSize(item.original_size as number)}
                    </p>
                  </div>
                  <div className="flex gap-1 mt-1">
                    <Button
                      size="sm"
                      className="h-6 text-[10px] px-2"
                      onClick={() => handleApproveMedia(item.id as string)}
                      disabled={actionLoading === item.id}
                    >
                      <CheckCircle className="h-3 w-3 mr-0.5" />
                      OK
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-6 text-[10px] px-2"
                      onClick={() => handleRejectMedia(item.id as string)}
                      disabled={actionLoading === item.id}
                    >
                      <XCircle className="h-3 w-3 mr-0.5" />
                      No
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
