interface TagChipProps {
  label: string;
  selected?: boolean;
  onClick?: () => void;
  disabled?: boolean;
}

/**
 * A single selectable failure tag. Used both as a toggle (ReviewForm) and
 * as a read-only chip (ConfirmSummary), controlled by `onClick` presence.
 */
export function TagChip({
  label,
  selected = false,
  onClick,
  disabled = false,
}: TagChipProps) {
  const classes = selected
    ? "badge badge-primary gap-1"
    : "badge badge-outline gap-1";

  if (!onClick) {
    return <span className={classes}>{label}</span>;
  }

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={`${classes} cursor-pointer`}
      aria-pressed={selected}
    >
      {label}
    </button>
  );
}
