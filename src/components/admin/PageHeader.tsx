import type { ReactNode } from "react";

/**
 * Shared header for admin pages: a title, optional description, and an
 * optional actions slot (buttons) aligned to the right. Keeps every admin
 * page visually consistent.
 */
export function PageHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="page-header">
      <div className="page-header-text">
        <h1>{title}</h1>
        {description ? <p className="sub">{description}</p> : null}
      </div>
      {actions ? <div className="page-header-actions">{actions}</div> : null}
    </div>
  );
}
