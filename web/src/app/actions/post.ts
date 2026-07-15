"use server";

import { createClient } from "@/lib/supabase/server";
import { createPostSchema, type CreatePostInput } from "@/validations/post";
import type { ActionResult, PostWithAuthor } from "@/types";

/**
 * Create a new post
 * Status depends on publication mode and user role
 */
export async function createPost(input: CreatePostInput): Promise<ActionResult<{ id: string }>> {
  try {
    const result = createPostSchema.safeParse(input);
    if (!result.success) {
      return {
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "Dati non validi",
          details: result.error.flatten().fieldErrors,
        },
      };
    }

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

    const data = result.data;

    // Check if user can post to this memorial
    const { data: guardian } = await supabase
      .from("memorial_guardians")
      .select("id, role, can_edit")
      .eq("memorial_id", data.memorialId)
      .eq("profile_id", user.id)
      .eq("is_active", true)
      .maybeSingle();

    const { data: member } = await supabase
      .from("memorial_members")
      .select("id, role, status")
      .eq("memorial_id", data.memorialId)
      .eq("profile_id", user.id)
      .eq("status", "approved")
      .maybeSingle();

    // Check publication mode
    const { data: memorialSettings } = await supabase
      .from("memorial_settings")
      .select("require_approval_for_posts")
      .eq("memorial_id", data.memorialId)
      .single();

    // Determine initial status - always use valid enum values
    let status: string = data.status ?? "pending_family_review";
    if (guardian?.can_edit) {
      // Guardians can publish directly
      status = "published";
    } else if ((member?.role as string) === "trusted_contributor") {
      // Trusted contributors auto-publish if settings allow
      status = memorialSettings?.require_approval_for_posts ? "pending_family_review" : "published";
    }

    // Create post
    const { data: post, error } = await supabase
      .from("posts")
      .insert({
        memorial_id: data.memorialId,
        author_id: user.id,
        title: data.title || null,
        content: data.content,
        status,
        published_at: status === "published" ? new Date().toISOString() : null,
      })
      .select("id")
      .single();

    if (error) {
      console.error("CreatePost error:", error);
      return {
        success: false,
        error: { code: "INSERT_ERROR", message: "Errore nella creazione del post" },
      };
    }

    // Link media if provided
    if (data.mediaIds && data.mediaIds.length > 0) {
      await supabase
        .from("media_assets")
        .update({ post_id: post.id })
        .in("id", data.mediaIds)
        .eq("memorial_id", data.memorialId);
    }

    // Add to album if provided
    if (data.albumId) {
      await supabase
        .from("media_assets")
        .update({ album_id: data.albumId })
        .in("id", data.mediaIds ?? [])
        .eq("memorial_id", data.memorialId);
    }

    // Create revision record
    await supabase.from("post_revisions").insert({
      post_id: post.id,
      author_id: user.id,
      title: data.title || null,
      content: data.content,
      revision_type: "created",
    });

    // Audit log
    await supabase.from("audit_events").insert({
      actor_id: user.id,
      actor_type: "user",
      action: "post_created",
      resource_type: "post",
      resource_id: post.id,
      memorial_id: data.memorialId,
      metadata: { status, has_media: !!data.mediaIds?.length },
    });

    // Notify if pending review
    if (status === "pending_family_review") {
      await supabase.from("outbox_events").insert({
        event_type: "content_pending_review",
        aggregate_type: "post",
        aggregate_id: post.id,
        payload: {
          memorial_id: data.memorialId,
          post_id: post.id,
          author_id: user.id,
        },
        available_at: new Date().toISOString(),
      });
    }

    return { success: true, data: { id: post.id } };
  } catch (error) {
    console.error("CreatePost error:", error);
    return {
      success: false,
      error: { code: "INTERNAL_ERROR", message: "Errore imprevisto" },
    };
  }
}

/**
 * List posts for a memorial
 */
export async function listMemorialPosts(
  memorialId: string,
  options?: {
    status?: string;
    page?: number;
    pageSize?: number;
  }
): Promise<ActionResult<{ items: PostWithAuthor[]; total: number }>> {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    const page = options?.page ?? 1;
    const pageSize = options?.pageSize ?? 20;
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    // Build status filter based on user role
    let statusFilter: string[] = ["published"];

    if (user) {
      const { data: guardian } = await supabase
        .from("memorial_guardians")
        .select("id")
        .eq("memorial_id", memorialId)
        .eq("profile_id", user.id)
        .eq("is_active", true)
        .maybeSingle();

      if (guardian) {
        statusFilter = ["draft", "pending_family_review", "approved", "published", "rejected", "hidden"];
      }
    }

    const { data, error, count } = await supabase
      .from("posts")
      .select(
        `
        *,
        profiles:author_id (id, full_name, display_name, avatar_url)
      `,
        { count: "exact" }
      )
      .eq("memorial_id", memorialId)
      .in("status", statusFilter)
      .is("deleted_at", null)
      .order("is_pinned", { ascending: false })
      .order("created_at", { ascending: false })
      .range(from, to);

    if (error) {
      console.error("ListPosts error:", error);
      return {
        success: false,
        error: { code: "FETCH_ERROR", message: "Errore nel recupero dei post" },
      };
    }

    const items: PostWithAuthor[] = (data ?? []).map((p) => ({
      id: p.id as string,
      memorialId: p.memorial_id as string,
      authorId: p.author_id as string,
      title: (p.title ?? null) as string | null,
      content: p.content as string,
      status: p.status,
      publishedAt: (p.published_at ?? null) as string | null,
      rejectedAt: (p.rejected_at ?? null) as string | null,
      rejectReason: (p.reject_reason ?? null) as string | null,
      reviewedBy: (p.reviewed_by ?? null) as string | null,
      reviewedAt: (p.reviewed_at ?? null) as string | null,
      isPinned: (p.is_pinned ?? false) as boolean,
      pinOrder: (p.pin_order ?? null) as number | null,
      reactionCount: (p.reaction_count ?? 0) as number,
      commentCount: (p.comment_count ?? 0) as number,
      createdAt: p.created_at as string,
      updatedAt: p.updated_at as string,
      deletedAt: (p.deleted_at ?? null) as string | null,
      author: p.profiles
        ? {
            id: (p.profiles as Record<string, unknown>).id as string,
            fullName: ((p.profiles as Record<string, unknown>).full_name ?? null) as string | null,
            displayName: ((p.profiles as Record<string, unknown>).display_name ?? null) as string | null,
            avatarUrl: ((p.profiles as Record<string, unknown>).avatar_url ?? null) as string | null,
          }
        : null,
    }));

    return { success: true, data: { items, total: count ?? 0 } };
  } catch (error) {
    console.error("ListMemorialPosts error:", error);
    return {
      success: false,
      error: { code: "INTERNAL_ERROR", message: "Errore imprevisto" },
    };
  }
}

/**
 * Approve a post (guardian only)
 */
export async function approvePost(postId: string): Promise<ActionResult<{ id: string }>> {
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

    // Get post memorial
    const { data: post } = await supabase
      .from("posts")
      .select("memorial_id, status")
      .eq("id", postId)
      .single();

    if (!post) {
      return {
        success: false,
        error: { code: "NOT_FOUND", message: "Post non trovato" },
      };
    }

    // Check guardian permission
    const { data: guardian } = await supabase
      .from("memorial_guardians")
      .select("id, can_edit")
      .eq("memorial_id", post.memorial_id as string)
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

    const { error } = await supabase
      .from("posts")
      .update({
        status: "published",
        published_at: new Date().toISOString(),
        reviewed_by: user.id,
        reviewed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", postId);

    if (error) {
      return {
        success: false,
        error: { code: "UPDATE_ERROR", message: "Errore nell'approvazione" },
      };
    }

    // Audit log
    await supabase.from("audit_events").insert({
      actor_id: user.id,
      actor_type: "user",
      action: "post_approved",
      resource_type: "post",
      resource_id: postId,
      memorial_id: post.memorial_id as string,
    });

    return { success: true, data: { id: postId } };
  } catch (error) {
    console.error("ApprovePost error:", error);
    return {
      success: false,
      error: { code: "INTERNAL_ERROR", message: "Errore imprevisto" },
    };
  }
}

/**
 * Reject a post (guardian only)
 */
export async function rejectPost(
  postId: string,
  reason: string
): Promise<ActionResult<{ id: string }>> {
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

    const { data: post } = await supabase
      .from("posts")
      .select("memorial_id")
      .eq("id", postId)
      .single();

    if (!post) {
      return {
        success: false,
        error: { code: "NOT_FOUND", message: "Post non trovato" },
      };
    }

    const { data: guardian } = await supabase
      .from("memorial_guardians")
      .select("id, can_edit")
      .eq("memorial_id", post.memorial_id as string)
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
      .from("posts")
      .update({
        status: "rejected",
        rejected_at: new Date().toISOString(),
        reject_reason: reason,
        reviewed_by: user.id,
        reviewed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", postId);

    if (error) {
      return {
        success: false,
        error: { code: "UPDATE_ERROR", message: "Errore nel rifiuto" },
      };
    }

    await supabase.from("audit_events").insert({
      actor_id: user.id,
      actor_type: "user",
      action: "post_rejected",
      resource_type: "post",
      resource_id: postId,
      memorial_id: post.memorial_id as string,
      metadata: { reason },
    });

    return { success: true, data: { id: postId } };
  } catch (error) {
    console.error("RejectPost error:", error);
    return {
      success: false,
      error: { code: "INTERNAL_ERROR", message: "Errore imprevisto" },
    };
  }
}
