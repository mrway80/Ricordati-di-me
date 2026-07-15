"use server";

import { createClient } from "@/lib/supabase/server";
import {
  uploadSessionSchema,
  validateFile,
  type UploadSessionInput,
} from "@/validations/media";
import type { ActionResult, MediaAsset } from "@/types";

/**
 * Create an upload session
 * 1. Validates user permissions
 * 2. Validates file metadata
 * 3. Creates media_assets record in quarantine state
 * 4. Returns signed upload URL
 */
export async function createUploadSession(
  input: UploadSessionInput
): Promise<
  ActionResult<{
    mediaId: string;
    uploadUrl: string;
    path: string;
  }>
> {
  try {
    // Validate input
    const result = uploadSessionSchema.safeParse(input);
    if (!result.success) {
      return {
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "Dati di upload non validi",
          details: result.error.flatten().fieldErrors,
        },
      };
    }

    const data = result.data;

    // Validate file type and size
    const fileValidation = validateFile(data.mediaType, data.mimeType, data.fileSize);
    if (!fileValidation.valid) {
      return {
        success: false,
        error: { code: "INVALID_FILE", message: fileValidation.error! },
      };
    }

    const supabase = await createClient();

    // Get current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return {
        success: false,
        error: { code: "UNAUTHORIZED", message: "Autenticazione richiesta" },
      };
    }

    // Check if user has access to the memorial
    const { data: membership } = await supabase
      .from("memorial_guardians")
      .select("id")
      .eq("memorial_id", data.memorialId)
      .eq("profile_id", user.id)
      .eq("is_active", true)
      .maybeSingle();

    const { data: memberAccess } = await supabase
      .from("memorial_members")
      .select("id, status")
      .eq("memorial_id", data.memorialId)
      .eq("profile_id", user.id)
      .eq("status", "approved")
      .maybeSingle();

    if (!membership && !memberAccess) {
      return {
        success: false,
        error: {
          code: "FORBIDDEN",
          message: "Non hai accesso a questo memoriale",
        },
      };
    }

    // Check upload quota (max 100 pending uploads per memorial per day)
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const { count: dailyUploads } = await supabase
      .from("media_assets")
      .select("id", { count: "exact", head: true })
      .eq("memorial_id", data.memorialId)
      .eq("uploaded_by", user.id)
      .gte("created_at", todayStart.toISOString());

    if ((dailyUploads ?? 0) >= 100) {
      return {
        success: false,
        error: {
          code: "QUOTA_EXCEEDED",
          message: "Limite giornaliero di upload raggiunto (100 file/giorno)",
        },
      };
    }

    // Generate secure path
    const timestamp = Date.now();
    const randomSuffix = Math.random().toString(36).substring(2, 10);
    const safeFileName = data.fileName.replace(/[^a-zA-Z0-9._-]/g, "_");
    const path = `${data.memorialId}/${data.mediaType}/${timestamp}-${randomSuffix}-${safeFileName}`;

    // Create media_assets record in uploading state
    const { data: mediaRecord, error: insertError } = await supabase
      .from("media_assets")
      .insert({
        memorial_id: data.memorialId,
        uploaded_by: user.id,
        media_type: data.mediaType,
        original_filename: data.fileName,
        original_path: path,
        original_size: data.fileSize,
        mime_type: data.mimeType,
        status: "uploading",
        width: data.width ?? null,
        height: data.height ?? null,
        duration: data.duration ?? null,
        alt_text: data.altText ?? null,
        exif_stripped: false,
        ai_generated: false,
      })
      .select("id")
      .single();

    if (insertError) {
      console.error("Media insert error:", insertError);
      return {
        success: false,
        error: { code: "INSERT_ERROR", message: "Errore nella creazione del record media" },
      };
    }

    // Generate signed upload URL (1 hour expiry)
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("media-quarantine")
      .createSignedUploadUrl(path);

    if (uploadError) {
      // Rollback: delete the media record
      await supabase.from("media_assets").delete().eq("id", mediaRecord.id);
      return {
        success: false,
        error: {
          code: "UPLOAD_URL_ERROR",
          message: "Errore nella generazione dell'URL di upload",
        },
      };
    }

    // Audit log
    await supabase.from("audit_events").insert({
      actor_id: user.id,
      actor_type: "user",
      action: "media_upload_initiated",
      resource_type: "media_asset",
      resource_id: mediaRecord.id,
      memorial_id: data.memorialId,
      metadata: {
        filename: data.fileName,
        media_type: data.mediaType,
        size: data.fileSize,
        path,
      },
    });

    return {
      success: true,
      data: {
        mediaId: mediaRecord.id,
        uploadUrl: uploadData.signedUrl,
        path,
      },
    };
  } catch (error) {
    console.error("CreateUploadSession error:", error);
    return {
      success: false,
      error: { code: "INTERNAL_ERROR", message: "Errore imprevisto" },
    };
  }
}

/**
 * Confirm upload completion
 * Updates media status from uploading to processing
 */
export async function confirmUpload(
  mediaId: string
): Promise<ActionResult<{ mediaId: string; status: string }>> {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return {
        success: false,
        error: { code: "UNAUTHORIZED", message: "Autenticazione richiesta" },
      };
    }

    // Update media status to processing
    const { data, error } = await supabase
      .from("media_assets")
      .update({
        status: "processing",
        updated_at: new Date().toISOString(),
      })
      .eq("id", mediaId)
      .eq("uploaded_by", user.id) // Only the uploader can confirm
      .select("id, status")
      .single();

    if (error) {
      console.error("ConfirmUpload error:", error);
      return {
        success: false,
        error: { code: "UPDATE_ERROR", message: "Errore nella conferma dell'upload" },
      };
    }

    // Insert outbox event for async processing
    await supabase.from("outbox_events").insert({
      event_type: "media_processing_requested",
      aggregate_type: "media_asset",
      aggregate_id: mediaId,
      payload: { media_id: mediaId, initiated_by: user.id },
      available_at: new Date().toISOString(),
    });

    return {
      success: true,
      data: { mediaId: data.id, status: data.status },
    };
  } catch (error) {
    console.error("ConfirmUpload error:", error);
    return {
      success: false,
      error: { code: "INTERNAL_ERROR", message: "Errore imprevisto" },
    };
  }
}

/**
 * Approve media (guardian/family only)
 */
export async function approveMedia(
  mediaId: string,
  _memorialId: string
): Promise<ActionResult<{ mediaId: string }>> {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return {
        success: false,
        error: { code: "UNAUTHORIZED", message: "Autenticazione richiesta" },
      };
    }

    // Check if user is guardian
    const { data: media } = await supabase
      .from("media_assets")
      .select("memorial_id")
      .eq("id", mediaId)
      .single();

    if (!media) {
      return {
        success: false,
        error: { code: "NOT_FOUND", message: "Media non trovato" },
      };
    }

    const { data: guardian } = await supabase
      .from("memorial_guardians")
      .select("id, can_edit")
      .eq("memorial_id", media.memorial_id)
      .eq("profile_id", user.id)
      .eq("is_active", true)
      .single();

    if (!guardian?.can_edit) {
      return {
        success: false,
        error: {
          code: "FORBIDDEN",
          message: "Non hai i permessi per approvare questo contenuto",
        },
      };
    }

    // Approve: move from quarantine to public/private bucket
    const { error } = await supabase
      .from("media_assets")
      .update({
        status: "approved",
        reviewed_by: user.id,
        reviewed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", mediaId);

    if (error) {
      console.error("ApproveMedia error:", error);
      return {
        success: false,
        error: { code: "UPDATE_ERROR", message: "Errore nell'approvazione" },
      };
    }

    // Audit log
    await supabase.from("audit_events").insert({
      actor_id: user.id,
      actor_type: "user",
      action: "media_approved",
      resource_type: "media_asset",
      resource_id: mediaId,
      memorial_id: media.memorial_id,
    });

    return { success: true, data: { mediaId } };
  } catch (error) {
    console.error("ApproveMedia error:", error);
    return {
      success: false,
      error: { code: "INTERNAL_ERROR", message: "Errore imprevisto" },
    };
  }
}

/**
 * Reject media (guardian/family only)
 */
export async function rejectMedia(
  mediaId: string,
  reason: string
): Promise<ActionResult<{ mediaId: string }>> {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return {
        success: false,
        error: { code: "UNAUTHORIZED", message: "Autenticazione richiesta" },
      };
    }

    const { data: media } = await supabase
      .from("media_assets")
      .select("memorial_id")
      .eq("id", mediaId)
      .single();

    if (!media) {
      return {
        success: false,
        error: { code: "NOT_FOUND", message: "Media non trovato" },
      };
    }

    const { data: guardian } = await supabase
      .from("memorial_guardians")
      .select("id, can_edit")
      .eq("memorial_id", media.memorial_id)
      .eq("profile_id", user.id)
      .eq("is_active", true)
      .single();

    if (!guardian?.can_edit) {
      return {
        success: false,
        error: {
          code: "FORBIDDEN",
          message: "Non hai i permessi per rifiutare questo contenuto",
        },
      };
    }

    const { error } = await supabase
      .from("media_assets")
      .update({
        status: "rejected",
        reviewed_by: user.id,
        reviewed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", mediaId);

    if (error) {
      return {
        success: false,
        error: { code: "UPDATE_ERROR", message: "Errore nel rifiuto" },
      };
    }

    // Audit log
    await supabase.from("audit_events").insert({
      actor_id: user.id,
      actor_type: "user",
      action: "media_rejected",
      resource_type: "media_asset",
      resource_id: mediaId,
      memorial_id: media.memorial_id,
      metadata: { reason },
    });

    return { success: true, data: { mediaId } };
  } catch (error) {
    console.error("RejectMedia error:", error);
    return {
      success: false,
      error: { code: "INTERNAL_ERROR", message: "Errore imprevisto" },
    };
  }
}

/**
 * List media for a memorial
 */
export async function listMemorialMedia(
  memorialId: string,
  options?: {
    status?: string;
    mediaType?: string;
    page?: number;
    pageSize?: number;
  }
): Promise<ActionResult<{ items: MediaAsset[]; total: number }>> {
  try {
    const supabase = await createClient();

    const page = options?.page ?? 1;
    const pageSize = options?.pageSize ?? 20;
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    let query = supabase
      .from("media_assets")
      .select("*", { count: "exact" })
      .eq("memorial_id", memorialId)
      .is("deleted_at", null)
      .order("created_at", { ascending: false })
      .range(from, to);

    if (options?.status) {
      query = query.eq("status", options.status);
    }

    if (options?.mediaType) {
      query = query.eq("media_type", options.mediaType);
    }

    const { data, error, count } = await query;

    if (error) {
      console.error("ListMedia error:", error);
      return {
        success: false,
        error: { code: "FETCH_ERROR", message: "Errore nel recupero dei media" },
      };
    }

    const items: MediaAsset[] = (data ?? []).map((m) => ({
      id: m.id,
      memorialId: m.memorial_id,
      uploadedBy: m.uploaded_by,
      postId: m.post_id,
      albumId: m.album_id,
      mediaType: m.media_type,
      originalFilename: m.original_filename,
      originalPath: m.original_path,
      originalSize: m.original_size,
      mimeType: m.mime_type,
      status: m.status,
      width: m.width,
      height: m.height,
      duration: m.duration,
      exifStripped: m.exif_stripped,
      perceptualHash: m.perceptual_hash,
      isDuplicate: m.is_duplicate,
      altText: m.alt_text,
      ocrText: m.ocr_text,
      ocrConfidence: m.ocr_confidence,
      moderationScore: m.moderation_score,
      moderationFlags: m.moderation_flags,
      aiGenerated: m.ai_generated,
      aiDisclosure: m.ai_disclosure,
      createdAt: m.created_at,
      updatedAt: m.updated_at,
      deletedAt: m.deleted_at,
    }));

    return { success: true, data: { items, total: count ?? 0 } };
  } catch (error) {
    console.error("ListMemorialMedia error:", error);
    return {
      success: false,
      error: { code: "INTERNAL_ERROR", message: "Errore imprevisto" },
    };
  }
}
