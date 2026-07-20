import Image from "next/image";

/**
 * Brand mark. Source file lives at public/cg-logo.png — replace that file
 * to change the logo everywhere (header, admin, staff). The favicon is a
 * separate asset at src/app/icon.png.
 */
export function Logo({ size = 48 }: { size?: number }) {
  return (
    <Image
      src="/cg-logo.png"
      alt="C&amp;G Global"
      width={size}
      height={size}
      className="brand-logo"
      priority
    />
  );
}
