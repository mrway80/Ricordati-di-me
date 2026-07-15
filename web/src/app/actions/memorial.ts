"use server";

import { createClient } from "@/lib/supabase/server";
import {
  createMemorialSchema,
  updateMemorialSchema,
  memorialFilterSchema,
  type CreateMemorialInput,
  type UpdateMemorialInput,
  type MemorialFilterInput,
} from "@/validations/memorial";
import { generateMemorialSlug } from "@/lib/utils";
import type { ActionResult, Memorial, MemorialWithGuardian, PaginatedResult } from "@/types";

/**
 * Create a new memorial
 * The creator becomes the guardian
 */
export async function createMemorial(
  input: CreateMemorialInput
): Promise<ActionResult<{ id: string; slug: string }>> {
  try {
    // Validate
    const result = createMemorialSchema.safeParse(input);
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

    // Get current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return {
        success: false,
        error: { code: "UNAUTHORIZED", message: "Devi essere autenticato per creare un memoriale" },
      };
    }

    const data = result.data;

    // Generate unique slug
    const birthYear = data.birthDate ? data.birthDate.split("-")[0] : null;
    const baseSlug = generateMemorialSlug(data.firstName, data.lastName, birthYear);

    // Check slug uniqueness
    let slug = baseSlug;
    let counter = 1;
    let slugExists = true;

    while (slugExists) {
      const { data: existing } = await supabase
        .from("memorials")
        .select("id")
        .eq("slug", slug)
        .maybeSingle();

      if (!existing) {
        slugExists = false;
      } else {
        slug = `${baseSlug}-${counter}`;
        counter++;
      }
    }

    // Create memorial
    const { data: memorial, error: insertError } = await supabase
      .from("memorials")
      .insert({
        slug,
        first_name: data.firstName,
        last_name: data.lastName,
        nickname: data.nickname || null,
        birth_date: data.birthDate || null,
        birth_place: data.birthPlace || null,
        death_date: data.deathDate || null,
        death_place: data.deathPlace || null,
        biography: data.biography || null,
        visibility: data.visibility,
        status: "active",
        publication_mode: "strict_review",
        created_by: user.id,
      })
      .select("id, slug")
      .single();

    if (insertError) {
      console.error("Memorial insert error:", insertError);
      return {
        success: false,
        error: { code: "INSERT_ERROR", message: "Errore nella creazione del memoriale" },
      };
    }

    // Create guardian record
    const { error: guardianError } = await supabase.from("memorial_guardians").insert({
      memorial_id: memorial.id,
      profile_id: user.id,
      role: "guardian",
      relationship: data.guardianRelationship,
      relationship_description: data.guardianRelationshipDescription || null,
      can_edit: true,
      can_manage_members: true,
      can_moderate: true,
      is_active: true,
    });

    if (guardianError) {
      console.error("Guardian insert error:", guardianError);
      // Continue - the memorial was created
    }

    // Create default memorial settings
    const { error: settingsError } = await supabase.from("memorial_settings").insert({
      memorial_id: memorial.id,
      allow_comments: true,
      allow_reactions: true,
      allow_support_messages: true,
      require_approval_for_posts: true,
      require_approval_for_media: true,
    });

    if (settingsError) {
      console.error("Settings insert error:", settingsError);
    }

    // Audit log
    await supabase.from("audit_events").insert({
      actor_id: user.id,
      actor_type: "user",
      action: "memorial_created",
      resource_type: "memorial",
      resource_id: memorial.id,
      metadata: { slug, name: `${data.firstName} ${data.lastName}` },
    });

    return {
      success: true,
      data: { id: memorial.id, slug: memorial.slug },
    };
  } catch (error) {
    console.error("CreateMemorial error:", error);
    return {
      success: false,
      error: { code: "INTERNAL_ERROR", message: "Errore imprevisto nella creazione del memoriale" },
    };
  }
}

/**
 * Get memorial by slug with guardian info
 */
export async function getMemorialBySlug(
  slug: string
): Promise<ActionResult<MemorialWithGuardian>> {
  try {
    const supabase = await createClient();

    // Get current user
    const {
      data: { user },
    } = await supabase.auth.getUser();

    // Build query - RLS will handle visibility
    const { data: memorial, error } = await supabase
      .from("memorials")
      .select(
        `
        *,
        memorial_guardians (
          id, profile_id, role, relationship, relationship_description, can_edit, can_manage_members, can_moderate,
          profiles:profile_id (id, full_name, display_name, avatar_url)
        ),
        memorial_settings (allow_comments, allow_reactions, allow_support_messages)
      `
      )
      .eq("slug", slug)
      .is("deleted_at", null)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return {
          success: false,
          error: { code: "NOT_FOUND", message: "Memoriale non trovato" },
        };
      }
      console.error("GetMemorial error:", error);
      return {
        success: false,
        error: { code: "FETCH_ERROR", message: "Errore nel recupero del memoriale" },
      };
    }

    // Check access permissions
    const isGuardian = memorial.memorial_guardians?.some(
      (g: Record<string, unknown>) => g.profile_id === user?.id
    );
    const isMember = false; // Would need to check memorial_members

    if (memorial.visibility === "private" && !isGuardian && !isMember) {
      return {
        success: false,
        error: { code: "FORBIDDEN", message: "Non hai accesso a questo memoriale" },
      };
    }

    // Get stats
    const { count: memberCount } = await supabase
      .from("memorial_members")
      .select("id", { count: "exact", head: true })
      .eq("memorial_id", memorial.id)
      .eq("status", "approved");

    const { count: postCount } = await supabase
      .from("posts")
      .select("id", { count: "exact", head: true })
      .eq("memorial_id", memorial.id)
      .eq("status", "published")
      .is("deleted_at", null);

    const { count: photoCount } = await supabase
      .from("media_assets")
      .select("id", { count: "exact", head: true })
      .eq("memorial_id", memorial.id)
      .in("status", ["approved", "published"])
      .eq("media_type", "image")
      .is("deleted_at", null);

    const { count: supportCount } = await supabase
      .from("support_messages")
      .select("id", { count: "exact", head: true })
      .eq("memorial_id", memorial.id)
      .is("deleted_at", null);

    // Transform guardian info
    const guardian = memorial.memorial_guardians?.find(
      (g: Record<string, unknown>) => g.role === "guardian"
    );

    const transformed: MemorialWithGuardian = {
      id: memorial.id as string,
      slug: memorial.slug as string,
      firstName: memorial.first_name as string,
      lastName: memorial.last_name as string,
      nickname: (memorial.nickname ?? null) as string | null,
      birthDate: (memorial.birth_date ?? null) as string | null,
      birthPlace: (memorial.birth_place ?? null) as string | null,
      deathDate: (memorial.death_date ?? null) as string | null,
      deathPlace: (memorial.death_place ?? null) as string | null,
      biography: (memorial.biography ?? null) as string | null,
      mainPhotoUrl: (memorial.main_photo_url ?? null) as string | null,
      coverPhotoUrl: (memorial.cover_photo_url ?? null) as string | null,
      visibility: memorial.visibility as "public" | "private" | "invitation_only",
      status: memorial.status,
      publicationMode: memorial.publication_mode,
      createdBy: memorial.created_by as string,
      verifiedAt: (memorial.verified_at ?? null) as string | null,
      verifiedBy: (memorial.verified_by ?? null) as string | null,
      createdAt: memorial.created_at as string,
      updatedAt: memorial.updated_at as string,
      deletedAt: (memorial.deleted_at ?? null) as string | null,
      guardian: guardian
        ? {
            id: guardian.id as string,
            profileId: guardian.profile_id as string,
            fullName: (guardian.profiles?.full_name ?? null) as string | null,
            displayName: (guardian.profiles?.display_name ?? null) as string | null,
            avatarUrl: (guardian.profiles?.avatar_url ?? null) as string | null,
            relationship: guardian.relationship as string,
          }
        : undefined,
      stats: {
        memberCount: memberCount ?? 0,
        postCount: postCount ?? 0,
        photoCount: photoCount ?? 0,
        supportMessageCount: supportCount ?? 0,
      },
    };

    return { success: true, data: transformed };
  } catch (error) {
    console.error("GetMemorialBySlug error:", error);
    return {
      success: false,
      error: { code: "INTERNAL_ERROR", message: "Errore imprevisto" },
    };
  }
}

/**
 * List public memorials with filtering
 */
export async function listMemorials(
  filters: MemorialFilterInput
): Promise<ActionResult<PaginatedResult<Memorial>>> {
  try {
    const result = memorialFilterSchema.safeParse(filters);
    if (!result.success) {
      return {
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "Filtri non validi",
          details: result.error.flatten().fieldErrors,
        },
      };
    }

    const supabase = await createClient();
    const { query, visibility, status, page, pageSize, sortBy, sortOrder } = result.data;

    let dbQuery = supabase
      .from("memorials")
      .select("*", { count: "exact" })
      .eq("visibility", "public")
      .eq("status", "active")
      .is("deleted_at", null);

    if (query) {
      // Use full-text search if available, otherwise ILIKE
      dbQuery = dbQuery.or(
        `first_name.ilike.%${query}%,last_name.ilike.%${query}%,biography.ilike.%${query}%`
      );
    }

    if (visibility) {
      dbQuery = dbQuery.eq("visibility", visibility);
    }

    if (status) {
      dbQuery = dbQuery.eq("status", status);
    }

    // Sorting
    const sortColumn = sortBy === "last_name" ? "last_name" : sortBy === "birth_date" ? "birth_date" : "created_at";
    dbQuery = dbQuery.order(sortColumn, { ascending: sortOrder === "asc" });

    // Pagination
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;
    dbQuery = dbQuery.range(from, to);

    const { data, error, count } = await dbQuery;

    if (error) {
      console.error("ListMemorials error:", error);
      return {
        success: false,
        error: { code: "FETCH_ERROR", message: "Errore nel recupero dei memoriali" },
      };
    }

    const memorials: Memorial[] = (data ?? []).map((m) => ({
      id: m.id,
      slug: m.slug,
      firstName: m.first_name,
      lastName: m.last_name,
      nickname: m.nickname,
      birthDate: m.birth_date,
      birthPlace: m.birth_place,
      deathDate: m.death_date,
      deathPlace: m.death_place,
      biography: m.biography,
      mainPhotoUrl: m.main_photo_url,
      coverPhotoUrl: m.cover_photo_url,
      visibility: m.visibility,
      status: m.status,
      publicationMode: m.publication_mode,
      createdBy: m.created_by,
      verifiedAt: m.verified_at,
      verifiedBy: m.verified_by,
      createdAt: m.created_at,
      updatedAt: m.updated_at,
      deletedAt: m.deleted_at,
    }));

    const total = count ?? 0;

    return {
      success: true,
      data: {
        items: memorials,
        total,
        page,
        pageSize,
        hasMore: from + memorials.length < total,
      },
    };
  } catch (error) {
    console.error("ListMemorials error:", error);
    return {
      success: false,
      error: { code: "INTERNAL_ERROR", message: "Errore imprevisto" },
    };
  }
}

/**
 * Update memorial (guardian only)
 */
export async function updateMemorial(
  input: UpdateMemorialInput
): Promise<ActionResult<{ id: string }>> {
  try {
    const result = updateMemorialSchema.safeParse(input);
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

    // Check if user is guardian
    const { data: guardian } = await supabase
      .from("memorial_guardians")
      .select("id")
      .eq("memorial_id", result.data.id)
      .eq("profile_id", user.id)
      .eq("is_active", true)
      .single();

    if (!guardian) {
      return {
        success: false,
        error: { code: "FORBIDDEN", message: "Solo il custode può modificare il memoriale" },
      };
    }

    const { id, ...updateData } = result.data;

    // Build update object
    const update: Record<string, unknown> = {};
    if (updateData.firstName) update.first_name = updateData.firstName;
    if (updateData.lastName) update.last_name = updateData.lastName;
    if (updateData.nickname !== undefined) update.nickname = updateData.nickname;
    if (updateData.birthDate !== undefined) update.birth_date = updateData.birthDate;
    if (updateData.birthPlace !== undefined) update.birth_place = updateData.birthPlace;
    if (updateData.deathDate !== undefined) update.death_date = updateData.deathDate;
    if (updateData.deathPlace !== undefined) update.death_place = updateData.deathPlace;
    if (updateData.biography !== undefined) update.biography = updateData.biography;
    if (updateData.visibility) update.visibility = updateData.visibility;
    if (updateData.status) update.status = updateData.status;
    if (updateData.publicationMode) update.publication_mode = updateData.publicationMode;
    update.updated_at = new Date().toISOString();

    const { error } = await supabase.from("memorials").update(update).eq("id", id);

    if (error) {
      console.error("UpdateMemorial error:", error);
      return {
        success: false,
        error: { code: "UPDATE_ERROR", message: "Errore nell'aggiornamento" },
      };
    }

    return { success: true, data: { id } };
  } catch (error) {
    console.error("UpdateMemorial error:", error);
    return {
      success: false,
      error: { code: "INTERNAL_ERROR", message: "Errore imprevisto" },
    };
  }
}

/**
 * Check if user is guardian of a memorial
 */
export async function checkGuardianStatus(
  memorialId: string
): Promise<ActionResult<{ isGuardian: boolean; canEdit: boolean; canModerate: boolean }>> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: true, data: { isGuardian: false, canEdit: false, canModerate: false } };
    }

    const { data: guardian } = await supabase
      .from("memorial_guardians")
      .select("role, can_edit, can_moderate")
      .eq("memorial_id", memorialId)
      .eq("profile_id", user.id)
      .eq("is_active", true)
      .single();

    return {
      success: true,
      data: {
        isGuardian: !!guardian,
        canEdit: guardian?.can_edit ?? false,
        canModerate: guardian?.can_moderate ?? false,
      },
    };
  } catch (error) {
    console.error("CheckGuardianStatus error:", error);
    return {
      success: false,
      error: { code: "INTERNAL_ERROR", message: "Errore imprevisto" },
    };
  }
}
