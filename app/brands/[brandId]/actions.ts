"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { SupabaseBrandTrendRepository } from "@/features/brand-trend/infra/supabase-brand-trend-repository";
import { recordBrandAction } from "@/features/brand-trend/application/record-brand-action";

export interface RecordActionState {
  ok: boolean;
  message: string | null;
}

/**
 * Composition root for the brand action form (design.md, "Per-request
 * adapter rule"): builds the adapter from the request's own session client,
 * never a cached/module-level client.
 */
export async function recordBrandActionForBrand(
  brandId: string,
  _prevState: RecordActionState,
  formData: FormData,
): Promise<RecordActionState> {
  const takenAt = String(formData.get("takenAt") ?? "");
  const note = String(formData.get("note") ?? "");
  const tagIdRaw = formData.get("tagId");
  const tagId =
    tagIdRaw && String(tagIdRaw).length > 0 ? String(tagIdRaw) : null;

  const supabase = await createClient();
  const repo = new SupabaseBrandTrendRepository(supabase);

  const result = await recordBrandAction(repo, {
    brandId,
    takenAt,
    note,
    tagId,
  });

  if (result.ok) {
    revalidatePath(`/brands/${brandId}`);
    return { ok: true, message: "Action recorded." };
  }

  if (result.reason === "forbidden") {
    return {
      ok: false,
      message: "You can only record actions for brands you lead.",
    };
  }

  return { ok: false, message: "Enter a date and a note before saving." };
}
