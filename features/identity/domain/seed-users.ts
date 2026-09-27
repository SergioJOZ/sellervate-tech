import "server-only";

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
 * Server-only: emails stay on the server (A9). The password never lives in
 * this module either; it comes from `process.env.SEED_USER_PASSWORD` inside
 * the Server Action. The client switcher only receives `SwitcherOption`s.
 * Names are the seed decided in PR 3 (D1).
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

/** What the client-side switcher is allowed to see: no emails. */
export type SwitcherOption = Pick<
  SeedUser,
  "key" | "displayName" | "roleLabel"
>;

export function listSwitcherOptions(): SwitcherOption[] {
  return SEED_USERS.map(({ key, displayName, roleLabel }) => ({
    key,
    displayName,
    roleLabel,
  }));
}

export function findSeedUser(key: string): SeedUser | undefined {
  return SEED_USERS.find((u) => u.key === key);
}
