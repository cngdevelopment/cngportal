export function formatPrice(price: number | null | undefined): string {
  if (price === null || price === undefined) return "-";
  return price.toLocaleString("en-US", { style: "currency", currency: "USD" });
}
