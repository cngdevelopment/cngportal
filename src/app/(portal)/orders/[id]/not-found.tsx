import Link from "next/link";

export default function OrderNotFound() {
  return (
    <div className="empty" style={{ marginTop: 20 }}>
      That order doesn&rsquo;t exist.
      <br />
      <br />
      <Link href="/dashboard" className="btn ghost">
        Back to dashboard
      </Link>
    </div>
  );
}
