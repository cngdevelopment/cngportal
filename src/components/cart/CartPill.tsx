"use client";

import { usePathname, useRouter } from "next/navigation";
import { useCart } from "./CartProvider";

export function CartPill() {
  const { count } = useCart();
  const pathname = usePathname();
  const router = useRouter();

  if (count === 0 || pathname === "/cart") return null;

  return (
    <button className="pill" onClick={() => router.push("/cart")}>
      Order in progress · {count} item{count === 1 ? "" : "s"}
    </button>
  );
}
