import Image from "next/image";

export function Logo({ size = 34 }: { size?: number }) {
  return (
    <Image
      src="/cg-logo.png"
      alt="C&amp;G Wholesale"
      width={size}
      height={size}
      className="brand-logo"
      priority
    />
  );
}
