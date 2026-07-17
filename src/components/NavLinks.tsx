"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function NavLinks({ links }: { links: { href: string; label: string }[] }) {
  const pathname = usePathname();
  return (
    <>
      {links.map((l) => (
        <Link
          key={l.href}
          href={l.href}
          className={pathname === l.href || pathname.startsWith(l.href + "/") ? "on" : ""}
        >
          {l.label}
        </Link>
      ))}
    </>
  );
}
