import Link from "next/link";
import { requireCustomer } from "@/data/context";
import { listShipToAddresses } from "@/data/orders";
import { CartReview } from "@/components/cart/CartReview";
import { getSettings } from "@/server/settings/settings";
import { ROUTES } from "@/config/routes";

export const dynamic = "force-dynamic";

export default async function CartPage() {
  const ctx = await requireCustomer();
  const [shipTo, settings] = await Promise.all([
    listShipToAddresses(ctx.accountId),
    getSettings(),
  ]);

  return (
    <>
      <Link href={ROUTES.newOrder} className="back">
        &larr; Back to catalog
      </Link>
      <h1>Review Order</h1>
      <p className="sub">Check the lines, choose how it gets to you, and submit.</p>
      <CartReview
        shipToOptions={shipTo.map((s) => ({
          id: s.id,
          label: s.label,
          line1: s.line1,
          city: s.city,
          state: s.state,
          zip: s.zip,
          isDefault: s.isDefault,
        }))}
        warehouse={settings.warehouse}
      />
    </>
  );
}
