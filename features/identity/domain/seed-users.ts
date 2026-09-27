export type SeedRole = "team_lead" | "specialist";

export interface SeedUser {
  /** Key used by the switcher UI and the Server Action; never the raw email. */
  key: string;
  displayName: string;
  email: string;
  /** Label only — the database, not this label, is the source of authorization. */
  roleLabel: SeedRole;
}

/**
 * Emails and role labels only — no secret here. The password never lives in
 * this module: it comes from `process.env.SEED_USER_PASSWORD` at the point
 * of use in the Server Action (A9). Shared by the client-rendered switcher
 * UI and the server-only lookup in `findSeedUser`. Names/brands are the seed
 * decided in PR 3 (D1): Marta, Nuria (team leads), Dani, Leo, Sofía
 * (specialists).
 */
export const SEED_USERS: readonly SeedUser[] = [
  {
    key: "marta",
    displayName: "Marta",
    email: "marta@reply-review.test",
    roleLabel: "team_lead",
  },
  {
    key: "nuria",
    displayName: "Nuria",
    email: "nuria@reply-review.test",
    roleLabel: "team_lead",
  },
  {
    key: "dani",
    displayName: "Dani",
    email: "dani@reply-review.test",
    roleLabel: "specialist",
  },
  {
    key: "leo",
    displayName: "Leo",
    email: "leo@reply-review.test",
    roleLabel: "specialist",
  },
  {
    key: "sofia",
    displayName: "Sofía",
    email: "sofia@reply-review.test",
    roleLabel: "specialist",
  },
] as const;

export function findSeedUser(key: string): SeedUser | undefined {
  return SEED_USERS.find((u) => u.key === key);
}
