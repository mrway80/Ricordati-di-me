"use client";

import { useState } from "react";
import { Image, CheckCircle, XCircle, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { approveMedia, rejectMedia } from "@/app/actions/media";
import { formatFileSize } from "@/lib/utils";
import type { MediaAsset } from "@/types";

interface MediaGalleryProps {
  media: MediaAsset[];
  memorialId: string;
  isGuardian: boolean;
}

export default function MediaGallery({ media, memorialId, isGuardian }: MediaGalleryProps) {
  const [localMedia, setLocalMedia] = useState<MediaAsset[]>(media);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  async function handleApprove(mediaId: string) {
    setActionLoading(mediaId);
    const result = await approveMedia(mediaId, memorialId);
    setActionLoading(null);

    if (result.success) {
      setLocalMedia((prev) =>
        prev.map((m) => (m.id === mediaId ? { ...m, status: "approved" } : m))
      );
    }
  }

  async function handleReject(mediaId: string) {
    setActionLoading(mediaId);
    const result = await rejectMedia(mediaId, "Contenuto non appropriato");
    setActionLoading(null);

    if (result.success) {
      setLocalMedia((prev) =>
        prev.map((m) => (m.id === mediaId ? { ...m, status: "rejected" } : m))
      );
    }
  }

  if (localMedia.length === 0) {
    return (
      <div className="text-center py-16">
        <Image className="h-12 w-12 mx-auto text-border mb-4" />
        <h3 className="font-display text-lg font-medium mb-2">Nessuna foto ancora</h3>
        <p className="text-foreground-muted max-w-sm mx-auto">
          Le fotografie approvate appariranno qui.
        </p>
      </div>
    );
  }

  return (
    <div>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {localMedia.map((item) => (
          <div key={item.id} className="group relative">
            <div
              className="aspect-square rounded-lg overflow-hidden bg-muted cursor-pointer ring-1 ring-border hover:ring-primary/30 transition-all"
              onClick={() => setSelectedImage(item.originalPath)}
            >
              {item.mediaType === "image" ? (
                <img
                  src={`/api/media/preview/${item.id}`}
                  alt={item.altText || item.originalFilename}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = "none";
                  }}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-muted">
                  <Image className="h-8 w-8 text-foreground-subtle" />
                </div>
              )}
            </div>

            {/* Status Badge */}
            <div className="absolute top-2 right-2">
              <Badge
                variant={
                  item.status === "approved" || item.status === "published"
                    ? "default"
                    : item.status === "rejected"
                    ? "destructive"
                    : "secondary"
                }
                className="text-[10px] px-1.5 py-0"
              >
                {item.status === "approved" || item.status === "published" ? (
                  <CheckCircle className="h-3 w-3 mr-0.5" />
                ) : item.status === "rejected" ? (
                  <XCircle className="h-3 w-3 mr-0.5" />
                ) : (
                  <Clock className="h-3 w-3 mr-0.5" />
                )}
                {item.status === "approved" || item.status === "published"
                  ? "OK"
                  : item.status === "rejected"
                  ? "Rif"
                  : "..."}
              </Badge>
            </div>

            {/* Info */}
            <div className="mt-1.5 space-y-0.5">
              <p className="text-xs font-medium truncate">{item.originalFilename}</p>
              <p className="text-[10px] text-foreground-subtle">
                {formatFileSize(item.originalSize)}
                {item.width && item.height ? ` · ${item.width}×${item.height}` : ""}
              </p>
            </div>

            {/* Guardian Actions */}
            {isGuardian && (item.status === "processing" || item.status === "uploading") && (
              <div className="flex gap-1.5 mt-2">
                <Button
                  size="sm"
                  className="h-7 text-xs px-2"
                  onClick={() => handleApprove(item.id)}
                  disabled={actionLoading === item.id}
                >
                  <CheckCircle className="h-3 w-3 mr-1" />
                  OK
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 text-xs px-2"
                  onClick={() => handleReject(item.id)}
                  disabled={actionLoading === item.id}
                >
                  <XCircle className="h-3 w-3 mr-1" />
                  No
                </Button>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Lightbox */}
      {selectedImage && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
          onClick={() => setSelectedImage(null)}
        >
          <img
            src={selectedImage}
            alt=""
            className="max-w-full max-h-[90vh] object-contain rounded-lg"
          />
          <button
            className="absolute top-4 right-4 text-white/80 hover:text-white text-sm"
            onClick={() => setSelectedImage(null)}
          >
            Chiudi
          </button>
        </div>
      )}
    </div>
  );
}
