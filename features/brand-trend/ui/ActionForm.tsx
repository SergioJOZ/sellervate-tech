"use client";

import { useActionState } from "react";
import type { TagOption } from "../ports/brand-trend-repository";
import type { RecordActionState } from "@/app/brands/[brandId]/actions";

interface ActionFormProps {
  action: (
    prevState: RecordActionState,
    formData: FormData,
  ) => Promise<RecordActionState>;
  tagOptions: TagOption[];
}

const initialState: RecordActionState = { ok: false, message: null };

/**
 * Minimal action form (date, note required, optional tag) — design.md
 * "Recording a brand action" scenario. Server-side RLS is the real
 * authorization boundary; this form only shapes the input.
 */
export function ActionForm({ action, tagOptions }: ActionFormProps) {
  const [state, formAction, pending] = useActionState(action, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-3">
      <div className="flex flex-wrap gap-3">
        <label className="flex flex-col gap-1 text-sm">
          Date
          <input
            type="date"
            name="takenAt"
            required
            className="input input-sm"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Tag (optional)
          <select name="tagId" defaultValue="" className="select select-sm">
            <option value="">No tag</option>
            {tagOptions.map((tag) => (
              <option key={tag.id} value={tag.id}>
                {tag.label}
              </option>
            ))}
          </select>
        </label>
      </div>
      <label className="flex flex-col gap-1 text-sm">
        Note
        <textarea
          name="note"
          required
          rows={2}
          className="textarea textarea-sm"
          placeholder="What did the team do in response?"
        />
      </label>
      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={pending}
          className="btn btn-primary btn-sm w-fit"
        >
          Record action
        </button>
        {state.message && (
          <p
            aria-live="polite"
            className={state.ok ? "text-success text-sm" : "text-error text-sm"}
          >
            {state.message}
          </p>
        )}
      </div>
    </form>
  );
}
