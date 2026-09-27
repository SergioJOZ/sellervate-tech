import "server-only";

import { findSeedUser } from "../domain/seed-users";
import type { AuthGateway } from "../ports/auth-gateway";

export type SwitchUserResult =
  | { ok: true }
  | {
      ok: false;
      reason: "stub_auth_disabled" | "unknown_user" | "auth_failed";
    };

/**
 * Application use case for the stub-auth switcher (A9). Refuses to run
 * unless the caller confirms `STUB_AUTH === 'true'` — checked by the caller
 * (the Server Action) so the environment read stays a composition-root
 * concern, and re-checked here as a second guard.
 */
export async function switchUser(
  gateway: AuthGateway,
  userKey: string,
  password: string,
  stubAuthEnabled: boolean,
): Promise<SwitchUserResult> {
  if (!stubAuthEnabled) {
    return { ok: false, reason: "stub_auth_disabled" };
  }

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
