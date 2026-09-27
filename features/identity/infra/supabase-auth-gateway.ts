import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import type { AuthClaims, AuthGateway } from "../ports/auth-gateway";

/**
 * Built per request from `await createClient()` in `lib/supabase/server.ts`.
 * Never construct this from a cached/module-level client.
 */
export class SupabaseAuthGateway implements AuthGateway {
  constructor(private readonly supabase: SupabaseClient) {}

  async signInWithPassword(email: string, password: string): Promise<void> {
    const { error } = await this.supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
  }

  async signOut(): Promise<void> {
    await this.supabase.auth.signOut();
  }

  async getClaims(): Promise<AuthClaims> {
    const { data, error } = await this.supabase.auth.getClaims();
    if (error || !data) {
      return { userRole: null, brandIds: [] };
    }
    const claims = data.claims as Record<string, unknown>;
    const userRole = (claims.user_role as AuthClaims["userRole"]) ?? null;
    const brandIds = Array.isArray(claims.brand_ids)
      ? (claims.brand_ids as string[])
      : [];
    return { userRole, brandIds };
  }
}
