"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { SupabaseAuthGateway } from "@/features/identity/infra/supabase-auth-gateway";
import {
  switchUser,
  signOutUser,
} from "@/features/identity/application/switch-user";
import type { SwitchUserResult } from "@/features/identity/application/switch-user";

/**
 * Composition root for the switcher (A9). Refuses to run unless
 * `STUB_AUTH === 'true'`; the password comes only from server env
 * `SEED_USER_PASSWORD` and never reaches the browser.
 */
export async function switchUserAction(
  userKey: string,
): Promise<SwitchUserResult> {
  const stubAuthEnabled = process.env.STUB_AUTH === "true";
  if (!stubAuthEnabled) {
    throw new Error(
      "switchUserAction is disabled: STUB_AUTH must be 'true' to use the seeded-user switcher.",
    );
  }

  const password = process.env.SEED_USER_PASSWORD;
  if (!password) {
    throw new Error(
      "switchUserAction is misconfigured: SEED_USER_PASSWORD is not set.",
    );
  }

  const supabase = await createClient();
  const gateway = new SupabaseAuthGateway(supabase);

  const result = await switchUser(gateway, userKey, password, stubAuthEnabled);

  if (result.ok) {
    redirect("/");
  }

  return result;
}

export async function signOutAction(): Promise<void> {
  const supabase = await createClient();
  const gateway = new SupabaseAuthGateway(supabase);
  await signOutUser(gateway);
  redirect("/");
}
