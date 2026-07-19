import Link from "next/link";

export default function NotFound() {
  return (
    <div className="center-screen">
      <div className="state-card">
        <h1>Page not found</h1>
        <p>The page you&rsquo;re looking for doesn&rsquo;t exist or may have moved.</p>
        <Link href="/" className="btn">
          Go home
        </Link>
      </div>
    </div>
  );
}
