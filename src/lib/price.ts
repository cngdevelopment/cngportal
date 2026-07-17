export function formatPrice(price: number | null): string {
  if (price === null) return "—";
  return price.toLocaleString("en-US", { style: "currency", currency: "USD" });
}
