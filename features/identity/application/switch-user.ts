import "server-only";

import { findSeedUser } from "../domain/seed-users";
import type { AuthGateway } from "../ports/auth-gateway";

export type SwitchUserResult =
  | { ok: true }
  | {
      ok: false;
      reason: "unknown_user" | "auth_failed";
    };

/**
 * Application use case for the stub-auth switcher (A9). The `STUB_AUTH` gate
 * is an environment concern, so it lives once in the Server Action
 * (composition root), not here.
 */
export async function switchUser(
  gateway: AuthGateway,
  userKey: string,
  password: string,
): Promise<SwitchUserResult> {
  const seedUser = findSeedUser(userKey);
  if (!seedUser) {
    return { ok: false, reason: "unknown_user" };
  }

  try {
    await gateway.signInWithPassword(seedUser.email, password);
  } catch {
    return { ok: false, reason: "auth_failed" };
  }

  return { ok: true };
}

export async function signOutUser(gateway: AuthGateway): Promise<void> {
  await gateway.signOut();
}
