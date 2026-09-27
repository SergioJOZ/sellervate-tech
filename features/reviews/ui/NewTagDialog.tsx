"use client";

import { useId, useRef, useState, useTransition } from "react";
import { TAG_LABEL_MAX_LENGTH } from "../domain/brand-tag";
import type { CreateBrandTagResult, Tag } from "../ports/review-repository";

interface NewTagDialogProps {
  brandName: string;
  createTag: (
    label: string,
    description: string,
  ) => Promise<CreateBrandTagResult>;
  onCreated: (tag: Tag) => void;
}

/**
 * "+ New tag" trigger plus a daisyUI modal on a native `<dialog>`: focus
 * moves into the dialog on open, Esc closes it, and focus returns to the
 * trigger on close. The tag is always created for the reply's brand — the
 * Server Action derives the brand from the reply, not from this form.
 */
export function NewTagDialog({
  brandName,
  createTag,
  onCreated,
}: NewTagDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const [label, setLabel] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const titleId = useId();
  const labelId = useId();
  const descriptionId = useId();
  const errorId = useId();

  const open = () => {
    setLabel("");
    setDescription("");
    setError(null);
    dialogRef.current?.showModal();
  };

  const close = () => {
    dialogRef.current?.close();
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (label.trim().length === 0) {
      setError("Enter a label for the tag.");
      return;
    }
    setError(null);
    startTransition(async () => {
      const result = await createTag(label, description);
      if (!result.ok) {
        setError(result.message ?? "The tag could not be created.");
        return;
      }
      onCreated(result.tag);
      close();
    });
  };

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        className="badge badge-ghost cursor-pointer gap-1"
        onClick={open}
      >
        + New tag
      </button>

      <dialog
        ref={dialogRef}
        className="modal"
        aria-labelledby={titleId}
        onClose={() => triggerRef.current?.focus()}
        onCancel={(event) => {
          // Keep the dialog open while a create is in flight.
          if (pending) event.preventDefault();
        }}
      >
        <div className="modal-box">
          <h2 id={titleId} className="text-lg font-semibold">
            New {brandName} tag
          </h2>

          <form className="mt-4 flex flex-col gap-4" onSubmit={handleSubmit}>
            <div>
              <label
                className="mb-1 block text-sm font-medium"
                htmlFor={labelId}
              >
                Label
              </label>
              <input
                id={labelId}
                className="input w-full"
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                maxLength={TAG_LABEL_MAX_LENGTH}
                required
                aria-invalid={error !== null}
                aria-describedby={error ? errorId : undefined}
              />
            </div>

            <div>
              <label
                className="mb-1 block text-sm font-medium"
                htmlFor={descriptionId}
              >
                Description (optional)
              </label>
              <textarea
                id={descriptionId}
                className="textarea w-full"
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            {error ? (
              <p id={errorId} role="alert" className="text-sm text-error">
                {error}
              </p>
            ) : null}

            <div className="modal-action mt-0">
              <button
                type="button"
                className="btn btn-ghost"
                onClick={close}
                disabled={pending}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={pending}
              >
                {pending ? "Creating…" : "Create & select"}
              </button>
            </div>
          </form>
        </div>
        <form method="dialog" className="modal-backdrop">
          <button type="submit" tabIndex={-1} disabled={pending}>
            Close
          </button>
        </form>
      </dialog>
    </>
  );
}
