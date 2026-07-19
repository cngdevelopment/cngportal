import type { ReactNode } from "react";

/**
 * Consistent empty-state block for admin lists/tables (no results, nothing
 * created yet, etc.). Reuses the app's `.empty` card styling.
 */
export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="empty">
      <b>{title}</b>
      {description ? (
        <>
          <br />
          <span className="meta">{description}</span>
        </>
      ) : null}
      {action ? <div style={{ marginTop: 16 }}>{action}</div> : null}
    </div>
  );
}
