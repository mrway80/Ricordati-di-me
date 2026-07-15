import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

/**
 * Admin client with service role key.
 * ⚠️ NEVER use this in browser code or in API routes accessible from the client.
 * Use only in: server actions, route handlers, background jobs, moderation tools.
 */
export function createAdminClient() {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();

  if (!serviceRoleKey || !supabaseUrl) {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY and NEXT_PUBLIC_SUPABASE_URL must be set"
    );
  }

  return createClient<Database>(supabaseUrl, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}
