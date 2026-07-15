"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { signUpSchema, signInSchema, type SignUpInput, type SignInInput } from "@/validations/auth";
import { ActionResult } from "@/types";

// Error types
class AuthError extends Error {
  constructor(public code: string, message: string) {
    super(message);
    this.name = "AuthError";
  }
}

/**
 * Sign up a new user with email/password
 */
export async function signUp(input: SignUpInput): Promise<ActionResult<{ userId: string }>> {
  try {
    // Validate input
    const result = signUpSchema.safeParse(input);
    if (!result.success) {
      return {
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "Dati di input non validi",
          details: result.error.flatten().fieldErrors,
        },
      };
    }

    const supabase = await createClient();

    // Check if email already exists
    const { data: existingUser } = await supabase
      .from("profiles")
      .select("id")
      .eq("email", result.data.email)
      .single();

    if (existingUser) {
      return {
        success: false,
        error: {
          code: "EMAIL_EXISTS",
          message: "Un account con questa email esiste già",
        },
      };
    }

    // Create auth user
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: result.data.email,
      password: result.data.password,
      options: {
        data: {
          full_name: result.data.fullName,
          display_name: result.data.displayName || result.data.fullName,
        },
      },
    });

    if (authError) {
      throw new AuthError(authError.status?.toString() ?? "AUTH_ERROR", authError.message);
    }

    if (!authData.user) {
      return {
        success: false,
        error: { code: "USER_CREATION_FAILED", message: "Creazione utente fallita" },
      };
    }

    // Profile is created automatically via database trigger
    // Update profile with additional data
    const { error: profileError } = await supabase
      .from("profiles")
      .update({
        full_name: result.data.fullName,
        display_name: result.data.displayName || result.data.fullName,
        language: "it",
        timezone: "Europe/Rome",
        updated_at: new Date().toISOString(),
      })
      .eq("id", authData.user.id);

    if (profileError) {
      console.error("Profile update error:", profileError);
    }

    // Insert default preferences
    await supabase.from("user_preferences").insert({
      profile_id: authData.user.id,
    });

    // Insert consent record
    await supabase.from("user_consents").insert({
      profile_id: authData.user.id,
      terms_accepted: true,
      terms_version: "1.0",
      privacy_accepted: true,
      privacy_version: "1.0",
    });

    // Audit log
    await supabase.from("audit_events").insert({
      actor_id: authData.user.id,
      actor_type: "user",
      action: "user_registered",
      resource_type: "profile",
      resource_id: authData.user.id,
      metadata: { email: result.data.email },
    });

    return {
      success: true,
      data: { userId: authData.user.id },
    };
  } catch (error) {
    console.error("SignUp error:", error);
    if (error instanceof AuthError) {
      return { success: false, error: { code: error.code, message: error.message } };
    }
    return {
      success: false,
      error: { code: "INTERNAL_ERROR", message: "Si è verificato un errore imprevisto" },
    };
  }
}

/**
 * Sign in with email/password
 */
export async function signIn(input: SignInInput): Promise<ActionResult<{ userId: string }>> {
  try {
    const result = signInSchema.safeParse(input);
    if (!result.success) {
      return {
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "Dati di input non validi",
          details: result.error.flatten().fieldErrors,
        },
      };
    }

    const supabase = await createClient();

    const { data, error } = await supabase.auth.signInWithPassword({
      email: result.data.email,
      password: result.data.password,
    });

    if (error) {
      return {
        success: false,
        error: { code: "INVALID_CREDENTIALS", message: "Email o password non validi" },
      };
    }

    if (!data.user) {
      return {
        success: false,
        error: { code: "AUTH_FAILED", message: "Autenticazione fallita" },
      };
    }

    // Update last sign in
    await supabase
      .from("profiles")
      .update({ last_sign_in_at: new Date().toISOString() })
      .eq("id", data.user.id);

    return {
      success: true,
      data: { userId: data.user.id },
    };
  } catch (error) {
    console.error("SignIn error:", error);
    return {
      success: false,
      error: { code: "INTERNAL_ERROR", message: "Si è verificato un errore imprevisto" },
    };
  }
}

/**
 * Sign out
 */
export async function signOut(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/");
  redirect("/");
}

/**
 * Get current session
 */
export async function getSession() {
  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();
  return session;
}

/**
 * Get current user with profile
 */
export async function getCurrentUser() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  return { user, profile };
}
