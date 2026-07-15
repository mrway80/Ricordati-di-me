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
      const fieldErrors = result.error.flatten().fieldErrors;
      const firstMessage =
        Object.values(fieldErrors).flat().find(Boolean) ?? "Dati non validi";
      return {
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: firstMessage,
          details: fieldErrors,
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

    // Normalize optional blank form fields
    const birthDate = data.birthDate?.trim() || undefined;
    const deathDate = data.deathDate?.trim() || undefined;
    const nickname = data.nickname?.trim() || undefined;
    const birthPlace = data.birthPlace?.trim() || undefined;
    const deathPlace = data.deathPlace?.trim() || undefined;
    const biography = data.biography?.trim() || undefined;
    const guardianRelationshipDescription =
      data.guardianRelationshipDescription?.trim() || undefined;

    // Generate unique slug
    const birthYear = birthDate ? birthDate.split("-")[0] : null;
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

    const fullName = `${data.firstName} ${data.lastName}`.trim();

    // Create memorial (columns must match public.memorials schema)
    const { data: memorial, error: insertError } = await supabase
      .from("memorials")
      .insert({
        slug,
        full_name: fullName,
        birth_date: birthDate || null,
        death_date: deathDate || null,
        biography: biography || null,
        visibility: data.visibility,
        status: "active",
        created_by: user.id,
        primary_guardian_id: user.id,
        settings: {
          first_name: data.firstName,
          last_name: data.lastName,
          nickname: nickname || null,
          birth_place: birthPlace || null,
          death_place: deathPlace || null,
          guardian_relationship: data.guardianRelationship,
          guardian_relationship_description: guardianRelationshipDescription || null,
          publication_mode: "strict_review",
          allow_comments: true,
          allow_reactions: true,
          allow_support_messages: true,
          require_approval_for_posts: true,
          require_approval_for_media: true,
        },
      })
      .select("id, slug")
      .single();

    if (insertError) {
      console.error("Memorial insert error:", insertError);
      return {
        success: false,
        error: {
          code: "INSERT_ERROR",
          message: insertError.message || "Errore nella creazione del memoriale",
        },
      };
    }

    // Create guardian record (owner / primary)
    const { error: guardianError } = await supabase.from("memorial_guardians").insert({
      memorial_id: memorial.id,
      user_id: user.id,
      role: "owner",
      is_primary: true,
      can_edit: true,
      can_manage_members: true,
      can_moderate: true,
      granted_by: user.id,
    });

    if (guardianError) {
      console.error("Guardian insert error:", guardianError);
      // Memorial already created — still return success so the user can open it
    }

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
          id, user_id, role, is_primary, can_edit, can_manage_members, can_moderate,
          profiles:user_id (id, display_name, avatar_url)
        )
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
      (g: Record<string, unknown>) => g.user_id === user?.id
    );
    const isOwner =
      memorial.created_by === user?.id || memorial.primary_guardian_id === user?.id;
    const isMember = false; // Would need to check memorial_members

    if (memorial.visibility === "private" && !isGuardian && !isOwner && !isMember) {
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

    const settings = (memorial.settings ?? {}) as Record<string, unknown>;
    const fullName = (memorial.full_name as string) || "";
    const nameParts = fullName.trim().split(/\s+/);
    const firstName =
      (settings.first_name as string | undefined) || nameParts[0] || "";
    const lastName =
      (settings.last_name as string | undefined) ||
      (nameParts.length > 1 ? nameParts.slice(1).join(" ") : "");

    // Transform guardian info
    const guardian =
      memorial.memorial_guardians?.find(
        (g: Record<string, unknown>) => g.is_primary === true || g.role === "owner"
      ) || memorial.memorial_guardians?.[0];

    const guardianProfile = guardian?.profiles as
      | { display_name?: string | null; avatar_url?: string | null }
      | null
      | undefined;

    const transformed: MemorialWithGuardian = {
      id: memorial.id as string,
      slug: memorial.slug as string,
      firstName,
      lastName,
      nickname: (settings.nickname ?? null) as string | null,
      birthDate: (memorial.birth_date ?? null) as string | null,
      birthPlace: (settings.birth_place ?? null) as string | null,
      deathDate: (memorial.death_date ?? null) as string | null,
      deathPlace: (settings.death_place ?? null) as string | null,
      biography: (memorial.biography ?? null) as string | null,
      mainPhotoUrl: (memorial.profile_image_url ?? null) as string | null,
      coverPhotoUrl: null,
      visibility: memorial.visibility as "public" | "private" | "invitation_only",
      status: memorial.status,
      publicationMode:
        (settings.publication_mode as string | undefined) || "strict_review",
      createdBy: memorial.created_by as string,
      verifiedAt: null,
      verifiedBy: null,
      createdAt: memorial.created_at as string,
      updatedAt: memorial.updated_at as string,
      deletedAt: (memorial.deleted_at ?? null) as string | null,
      guardian: guardian
        ? {
            id: guardian.id as string,
            profileId: guardian.user_id as string,
            fullName: (guardianProfile?.display_name ?? null) as string | null,
            displayName: (guardianProfile?.display_name ?? null) as string | null,
            avatarUrl: (guardianProfile?.avatar_url ?? null) as string | null,
            relationship: (settings.guardian_relationship as string) || "",
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
        `full_name.ilike.%${query}%,biography.ilike.%${query}%`
      );
    }

    if (visibility) {
      dbQuery = dbQuery.eq("visibility", visibility);
    }

    if (status) {
      dbQuery = dbQuery.eq("status", status);
    }

    // Sorting
    const sortColumn =
      sortBy === "last_name"
        ? "full_name"
        : sortBy === "birth_date"
          ? "birth_date"
          : sortBy === "updated_at"
            ? "updated_at"
            : "created_at";
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

    const memorials: Memorial[] = (data ?? []).map((m) => {
      const settings = (m.settings ?? {}) as Record<string, unknown>;
      const fullName = (m.full_name as string) || "";
      const parts = fullName.trim().split(/\s+/);
      return {
        id: m.id,
        slug: m.slug,
        firstName: (settings.first_name as string) || parts[0] || "",
        lastName:
          (settings.last_name as string) ||
          (parts.length > 1 ? parts.slice(1).join(" ") : ""),
        nickname: (settings.nickname as string | null) ?? null,
        birthDate: m.birth_date,
        birthPlace: (settings.birth_place as string | null) ?? null,
        deathDate: m.death_date,
        deathPlace: (settings.death_place as string | null) ?? null,
        biography: m.biography,
        mainPhotoUrl: m.profile_image_url,
        coverPhotoUrl: null,
        visibility: m.visibility,
        status: m.status,
        publicationMode:
          (settings.publication_mode as string) || "strict_review",
        createdBy: m.created_by,
        verifiedAt: null,
        verifiedBy: null,
        createdAt: m.created_at,
        updatedAt: m.updated_at,
        deletedAt: m.deleted_at,
      };
    });

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
      .eq("user_id", user.id)
      .maybeSingle();

    if (!guardian) {
      return {
        success: false,
        error: { code: "FORBIDDEN", message: "Solo il custode può modificare il memoriale" },
      };
    }

    const { id, ...updateData } = result.data;

    // Load current settings to merge
    const { data: current } = await supabase
      .from("memorials")
      .select("settings, full_name")
      .eq("id", id)
      .single();

    const currentSettings = (current?.settings ?? {}) as Record<string, unknown>;
    const nextSettings = { ...currentSettings };

    const update: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (updateData.firstName) nextSettings.first_name = updateData.firstName;
    if (updateData.lastName) nextSettings.last_name = updateData.lastName;
    if (updateData.nickname !== undefined) nextSettings.nickname = updateData.nickname;
    if (updateData.birthPlace !== undefined) nextSettings.birth_place = updateData.birthPlace;
    if (updateData.deathPlace !== undefined) nextSettings.death_place = updateData.deathPlace;
    if (updateData.publicationMode)
      nextSettings.publication_mode = updateData.publicationMode;

    if (updateData.firstName || updateData.lastName) {
      const first =
        (nextSettings.first_name as string) ||
        String(current?.full_name ?? "").split(/\s+/)[0] ||
        "";
      const last = (nextSettings.last_name as string) || "";
      update.full_name = `${first} ${last}`.trim();
    }

    if (updateData.birthDate !== undefined) update.birth_date = updateData.birthDate;
    if (updateData.deathDate !== undefined) update.death_date = updateData.deathDate;
    if (updateData.biography !== undefined) update.biography = updateData.biography;
    if (updateData.visibility) update.visibility = updateData.visibility;
    if (updateData.status) update.status = updateData.status;
    update.settings = nextSettings;

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
      .eq("user_id", user.id)
      .maybeSingle();

    // Also treat primary_guardian / creator as guardian
    let isGuardian = !!guardian;
    let canEdit = guardian?.can_edit ?? false;
    let canModerate = guardian?.can_moderate ?? false;

    if (!isGuardian) {
      const { data: memorial } = await supabase
        .from("memorials")
        .select("created_by, primary_guardian_id")
        .eq("id", memorialId)
        .maybeSingle();

      if (
        memorial &&
        (memorial.created_by === user.id || memorial.primary_guardian_id === user.id)
      ) {
        isGuardian = true;
        canEdit = true;
        canModerate = true;
      }
    }

    return {
      success: true,
      data: {
        isGuardian,
        canEdit,
        canModerate,
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
