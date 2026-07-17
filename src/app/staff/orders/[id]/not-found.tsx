import Link from "next/link";

export default function StaffOrderNotFound() {
  return (
    <div className="empty" style={{ marginTop: 20 }}>
      That order doesn&rsquo;t exist.
      <br />
      <br />
      <Link href="/staff/queue" className="btn ghost">
        Back to queue
      </Link>
    </div>
  );
}
