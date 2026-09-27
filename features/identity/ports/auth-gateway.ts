export interface AuthClaims {
  userRole: "team_lead" | "specialist" | null;
  brandIds: string[];
}

/**
 * Port for the one identity operation this feature needs. The infra adapter
 * is built per request from the user-session Supabase client (design.md,
 * "Per-request adapter rule") — never a module-level singleton, never the
 * service role.
 */
export interface AuthGateway {
  signInWithPassword(email: string, password: string): Promise<void>;
  signOut(): Promise<void>;
  getClaims(): Promise<AuthClaims>;
}
