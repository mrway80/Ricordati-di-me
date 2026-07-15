import { z } from "zod";

export const uploadSessionSchema = z.object({
  memorialId: z.string().uuid(),
  mediaType: z.enum(["image", "video", "audio", "document"]),
  fileName: z
    .string()
    .min(1)
    .max(255)
    .regex(
      /^[a-zA-Z0-9\s._-]+$/,
      "Il nome file contiene caratteri non validi"
    ),
  fileSize: z
    .number()
    .int()
    .min(1)
    .max(500 * 1024 * 1024, "File troppo grande (max 500MB)"),
  mimeType: z.string().max(100),
  width: z.number().int().min(1).max(32768).optional(),
  height: z.number().int().min(1).max(32768).optional(),
  duration: z.number().int().min(1).max(86400).optional(),
  altText: z.string().max(500).optional(),
});

export type UploadSessionInput = z.infer<typeof uploadSessionSchema>;

export const allowedMimeTypes: Record<string, string[]> = {
  image: [
    "image/jpeg",
    "image/png",
    "image/webp",
    "image/gif",
    "image/avif",
    "image/tiff",
  ],
  video: [
    "video/mp4",
    "video/webm",
    "video/ogg",
    "video/quicktime",
  ],
  audio: [
    "audio/mpeg",
    "audio/wav",
    "audio/ogg",
    "audio/aac",
    "audio/flac",
    "audio/webm",
  ],
  document: [
    "application/pdf",
    "text/plain",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ],
};

export const maxFileSizes: Record<string, number> = {
  image: 50 * 1024 * 1024, // 50MB
  video: 500 * 1024 * 1024, // 500MB
  audio: 100 * 1024 * 1024, // 100MB
  document: 20 * 1024 * 1024, // 20MB
};

export const validateFile = (
  mediaType: string,
  mimeType: string,
  fileSize: number
): { valid: boolean; error?: string } => {
  const allowedTypes = allowedMimeTypes[mediaType];
  if (!allowedTypes || !allowedTypes.includes(mimeType)) {
    return {
      valid: false,
      error: `Tipo MIME non valido per ${mediaType}. Tipi consentiti: ${(allowedTypes ?? []).join(", ")}`,
    };
  }

  const maxSize = maxFileSizes[mediaType];
  if (!maxSize || fileSize > maxSize) {
    return {
      valid: false,
      error: `File troppo grande. Dimensione massima per ${mediaType}: ${Math.round((maxSize ?? 0) / 1024 / 1024)}MB`,
    };
  }

  return { valid: true };
};
