import { EmptyState } from "@/components/ui/EmptyState";

/**
 * Empty-selection state for the split pane (design.md A21) — shown when
 * no reply is selected yet, and also effectively when the queue is empty.
 */
export default function QueuePage() {
  return (
    <EmptyState
      title="Select a reply to review"
      description="Choose a reply from the queue on the left, or wait for new unreviewed replies to appear."
    />
  );
}
