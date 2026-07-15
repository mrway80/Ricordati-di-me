"use client";

import { useState, useCallback } from "react";
import { Upload, AlertCircle, CheckCircle, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { createUploadSession, confirmUpload } from "@/app/actions/media";

interface UploadMediaButtonProps {
  memorialId: string;
}

type UploadItem = {
  id: string;
  file: File;
  progress: number;
  status: "uploading" | "processing" | "done" | "error";
  error?: string;
};

export default function UploadMediaButton({ memorialId }: UploadMediaButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [uploads, setUploads] = useState<UploadItem[]>([]);
  const [dragOver, setDragOver] = useState(false);

  const handleFiles = useCallback(
    async (files: FileList | null) => {
      if (!files) return;

      const imageFiles = Array.from(files).filter((f) => f.type.startsWith("image/"));

      for (const file of imageFiles) {
        const uploadId = crypto.randomUUID();

        setUploads((prev) => [
          ...prev,
          { id: uploadId, file, progress: 0, status: "uploading" },
        ]);

        // Create upload session
        const sessionResult = await createUploadSession({
          memorialId,
          mediaType: "image",
          fileName: file.name,
          fileSize: file.size,
          mimeType: file.type,
        });

        if (!sessionResult.success) {
          setUploads((prev) =>
            prev.map((u) =>
              u.id === uploadId
                ? { ...u, status: "error", error: sessionResult.error?.message ?? "Errore" }
                : u
            )
          );
          continue;
        }

        // Upload file using signed URL
        try {
          const xhr = new XMLHttpRequest();

          xhr.upload.addEventListener("progress", (e) => {
            if (e.lengthComputable) {
              const progress = Math.round((e.loaded / e.total) * 100);
              setUploads((prev) =>
                prev.map((u) => (u.id === uploadId ? { ...u, progress } : u))
              );
            }
          });

          await new Promise<void>((resolve, reject) => {
            xhr.addEventListener("load", () => {
              if (xhr.status >= 200 && xhr.status < 300) {
                resolve();
              } else {
                reject(new Error(`Upload failed: ${xhr.statusText}`));
              }
            });
            xhr.addEventListener("error", () => reject(new Error("Upload failed")));
            xhr.open("PUT", sessionResult.data!.uploadUrl);
            xhr.setRequestHeader("Content-Type", file.type);
            xhr.send(file);
          });

          // Confirm upload
          await confirmUpload(sessionResult.data!.mediaId);

          setUploads((prev) =>
            prev.map((u) =>
              u.id === uploadId ? { ...u, progress: 100, status: "processing" } : u
            )
          );
        } catch {
          setUploads((prev) =>
            prev.map((u) =>
              u.id === uploadId
                ? { ...u, status: "error", error: "Errore durante l'upload" }
                : u
            )
          );
        }
      }
    },
    [memorialId]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      handleFiles(e.dataTransfer.files);
    },
    [handleFiles]
  );

  if (!isOpen) {
    return (
      <Button variant="outline" size="sm" onClick={() => setIsOpen(true)}>
        <Upload className="mr-1.5 h-4 w-4" />
        Carica foto
      </Button>
    );
  }

  return (
    <Card className="w-full sm:w-auto bg-white">
      <CardContent className="p-4 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-display text-sm font-semibold">Carica fotografie</h3>
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => setIsOpen(false)}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div
          className={`upload-zone ${dragOver ? "dragover" : ""}`}
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
        >
          <Upload className="h-8 w-8 mx-auto text-foreground-subtle mb-2" />
          <p className="text-sm font-medium">Trascina le foto qui</p>
          <p className="text-xs text-foreground-subtle mt-1">oppure</p>
          <label className="mt-2 inline-block">
            <input
              type="file"
              multiple
              accept="image/*"
              className="hidden"
              onChange={(e) => handleFiles(e.target.files)}
            />
            <span className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-9 px-3 cursor-pointer">
              Seleziona file
            </span>
          </label>
          <p className="text-xs text-foreground-subtle mt-3">
            JPG, PNG, WebP. Max 50MB per file.
          </p>
        </div>

        {/* Upload Progress */}
        {uploads.length > 0 && (
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {uploads.map((upload) => (
              <div key={upload.id} className="flex items-center gap-3 text-sm">
                {upload.status === "uploading" && (
                  <>
                    <Progress value={upload.progress} className="h-2 flex-1" />
                    <span className="text-foreground-subtle text-xs">{upload.progress}%</span>
                  </>
                )}
                {upload.status === "processing" && (
                  <>
                    <CheckCircle className="h-4 w-4 text-success flex-shrink-0" />
                    <span className="text-success flex-1 truncate">{upload.file.name}</span>
                    <Badge variant="outline" className="text-xs">In quarantena</Badge>
                  </>
                )}
                {upload.status === "error" && (
                  <>
                    <AlertCircle className="h-4 w-4 text-error flex-shrink-0" />
                    <span className="text-error flex-1 truncate">{upload.file.name}</span>
                    <span className="text-xs text-error">{upload.error}</span>
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
