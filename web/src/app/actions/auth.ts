"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { signUpSchema, signInSchema, type SignUpInput, type SignInInput } from "@/validations/auth";
import { ActionResult } from "@/types";

// Error types removed — auth errors are returned directly

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
      const message =
        authError.message.toLowerCase().includes("already registered") ||
        authError.message.toLowerCase().includes("already exists")
          ? "Un account con questa email esiste già"
          : authError.message;

      return {
        success: false,
        error: { code: "AUTH_ERROR", message },
      };
    }

    if (!authData.user) {
      return {
        success: false,
        error: { code: "USER_CREATION_FAILED", message: "Creazione utente fallita" },
      };
    }

    return {
      success: true,
      data: { userId: authData.user.id },
    };
  } catch (error) {
    console.error("SignUp error:", error);
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
