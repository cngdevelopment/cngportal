/**
 * Loading placeholder shown by route-group `loading.tsx` files while a
 * Server Component's data resolves. Server component — no client JS.
 *
 * `variant="grid"` mirrors the catalog's product grid; `variant="list"`
 * (default) mirrors the dashboard/queue stacked cards.
 */
export function PageSkeleton({ variant = "list" }: { variant?: "list" | "grid" }) {
  return (
    <div aria-hidden="true">
      <div className="skeleton sk-title" />
      <div className="skeleton sk-sub" />
      {variant === "grid" ? (
        <div className="sk-grid">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="skeleton sk-tile" />
          ))}
        </div>
      ) : (
        <>
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="skeleton sk-card" />
          ))}
        </>
      )}
    </div>
  );
}
