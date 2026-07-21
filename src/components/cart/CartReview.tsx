"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "./CartProvider";
import { submitOrderAction } from "@/app/actions/orders";
import { formatPrice } from "@/lib/price";

interface ShipTo {
  id: string;
  label: string;
  line1: string;
  city: string;
  state: string;
  zip: string;
  isDefault: boolean;
}

interface Warehouse {
  address: string;
  hours: string;
  phone: string;
}

/** Sentinel select value meaning "I'll type a new address". */
const NEW_ADDRESS = "__new__";

interface NewAddress {
  label: string;
  line1: string;
  line2: string;
  city: string;
  state: string;
  zip: string;
  contactName: string;
  contactPhone: string;
}

const EMPTY_ADDRESS: NewAddress = {
  label: "",
  line1: "",
  line2: "",
  city: "",
  state: "",
  zip: "",
  contactName: "",
  contactPhone: "",
};

/** The fields we require before an order can ship to a typed-in address. */
function addressComplete(a: NewAddress): boolean {
  return !!(a.line1.trim() && a.city.trim() && a.state.trim() && a.zip.trim());
}

export function CartReview({
  shipToOptions,
  warehouse,
}: {
  shipToOptions: ShipTo[];
  warehouse: Warehouse;
}) {
  const { lines, updateQuantity, setLineAssembly, bulkSetAssembly, removeLine, clear } = useCart();
  const router = useRouter();

  const [deliveryMethod, setDeliveryMethod] = useState<"SHIP" | "PICKUP" | null>(null);
  // "__new__" = type a new address. Accounts with no saved addresses always start here.
  const [shipToId, setShipToId] = useState(
    shipToOptions.find((s) => s.isDefault)?.id ?? shipToOptions[0]?.id ?? NEW_ADDRESS
  );
  const [newAddress, setNewAddress] = useState<NewAddress>(EMPTY_ADDRESS);
  const [pickupName, setPickupName] = useState("");
  const [pickupPhone, setPickupPhone] = useState("");
  const [po, setPo] = useState("");
  const [requestedDate, setRequestedDate] = useState("");
  const [notes, setNotes] = useState("");
  const [submitTried, setSubmitTried] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const hasCabinets = lines.some((l) => l.category === "CABINETS");

  const summary = useMemo(() => {
    const sum = (f: (l: (typeof lines)[number]) => boolean) => lines.filter(f).reduce((a, l) => a + l.quantity, 0);
    const asm = sum((l) => l.assembly === "ASSEMBLED");
    const rta = sum((l) => l.assembly === "UNASSEMBLED");
    const flr = sum((l) => l.category === "FLOORING");
    const parts: string[] = [];
    if (asm) parts.push(`${asm} cabinet${asm === 1 ? "" : "s"} assembled`);
    if (rta) parts.push(`${rta} cabinet${rta === 1 ? "" : "s"} unassembled`);
    if (flr) parts.push(`${flr} box${flr === 1 ? "" : "es"} flooring`);
    let tail = "";
    if (deliveryMethod === "SHIP") tail = " — shipping to your jobsite";
    if (deliveryMethod === "PICKUP") tail = " — picking up at the warehouse";
    return parts.join(", ") + tail + ".";
  }, [lines, deliveryMethod]);

  const subtotal = useMemo(
    () => lines.reduce((sum, l) => sum + (l.unitPrice ?? 0) * l.quantity, 0),
    [lines]
  );

  const enteringNewAddress = shipToId === NEW_ADDRESS;

  function cartValid() {
    if (lines.length === 0) return false;
    if (!deliveryMethod) return false;
    if (deliveryMethod === "PICKUP" && (!pickupName.trim() || !pickupPhone.trim())) return false;
    if (deliveryMethod === "SHIP" && enteringNewAddress && !addressComplete(newAddress)) return false;
    if (!po.trim()) return false;
    return true;
  }

  function trySubmit() {
    setSubmitTried(true);
    if (!cartValid()) return;
    setConfirmOpen(true);
  }

  async function confirmSubmit() {
    setSubmitting(true);
    setError(null);
    try {
      const { orderId } = await submitOrderAction({
        lines: lines.map((l) => ({
          sku: l.sku,
          quantity: l.quantity,
          colorCode: l.colorCode,
          assembly: l.assembly,
          thickness: l.thickness,
          notes: l.notes,
        })),
        deliveryMethod: deliveryMethod!,
        shipToAddressId:
          deliveryMethod === "SHIP" && !enteringNewAddress ? shipToId || null : null,
        newShipTo:
          deliveryMethod === "SHIP" && enteringNewAddress ? newAddress : null,
        pickupContactName: deliveryMethod === "PICKUP" ? pickupName : null,
        pickupContactPhone: deliveryMethod === "PICKUP" ? pickupPhone : null,
        poNumber: po,
        requestedDate: requestedDate || null,
        customerNotes: notes || null,
      });
      clear();
      router.push(`/orders/${orderId}?justSubmitted=1`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't submit the order. Try again.");
      setConfirmOpen(false);
    } finally {
      setSubmitting(false);
    }
  }

  if (lines.length === 0) {
    return (
      <div className="empty">
        Your order is empty.
        <br />
        <br />
        <Link href="/new-order" className="btn">
          Browse the catalog
        </Link>
      </div>
    );
  }

  return (
    <div className="cart-cols">
      <div className="cart-main">
        {hasCabinets && (
          <div className="bulk">
            Set all cabinets to
            <span className="asm-toggle">
              <button type="button" onClick={() => bulkSetAssembly("ASSEMBLED")}>
                Assembled
              </button>
              <button type="button" onClick={() => bulkSetAssembly("UNASSEMBLED")}>
                Unassembled
              </button>
            </span>
          </div>
        )}

        <table className="list">
          <thead>
            <tr>
              <th>Product</th>
              <th>Finish / thickness</th>
              <th>Assembly</th>
              <th>Qty</th>
              <th>Price</th>
              <th>Line Total</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {lines.map((l) => (
              <tr key={l.key}>
                <td>
                  <b>{l.name}</b>
                  <br />
                  <span className="meta">
                    {l.sku}
                    {l.notes ? <> · {l.notes}</> : null}
                  </span>
                </td>
                <td>
                  {l.category === "CABINETS" ? (
                    <>
                      <span className="mini-sw" style={{ background: l.colorHex ?? "#ccc" }} />
                      {l.colorName}
                    </>
                  ) : (
                    l.thickness
                  )}
                </td>
                <td>
                  {l.category === "CABINETS" ? (
                    <span className="asm-toggle">
                      <button
                        type="button"
                        className={l.assembly === "ASSEMBLED" ? "on" : ""}
                        onClick={() => setLineAssembly(l.key, "ASSEMBLED")}
                      >
                        Asm
                      </button>
                      <button
                        type="button"
                        className={l.assembly === "UNASSEMBLED" ? "on" : ""}
                        onClick={() => setLineAssembly(l.key, "UNASSEMBLED")}
                      >
                        RTA
                      </button>
                    </span>
                  ) : (
                    <span style={{ color: "var(--ink-3)" }}>&mdash;</span>
                  )}
                </td>
                <td>
                  <span className="qty-inline">
                    <button type="button" onClick={() => updateQuantity(l.key, l.quantity - 1)}>
                      &minus;
                    </button>
                    <input
                      value={l.quantity}
                      readOnly
                      onChange={() => {
                        /* stepper-only, matches spec §9 */
                      }}
                    />
                    <button type="button" onClick={() => updateQuantity(l.key, l.quantity + 1)}>
                      +
                    </button>
                  </span>
                  {l.category === "FLOORING" && l.unitsPerBox && (
                    <div className="meta" style={{ marginTop: 3 }}>
                      {(l.quantity * l.unitsPerBox).toFixed(1)} sq ft
                    </div>
                  )}
                </td>
                <td>{formatPrice(l.unitPrice)}</td>
                <td>{l.unitPrice == null ? "—" : formatPrice(l.unitPrice * l.quantity)}</td>
                <td>
                  <button type="button" className="rm" onClick={() => removeLine(l.key)}>
                    Remove
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="cart-side">
        <div className="subtotal-line">
          <span>Subtotal</span>
          <b>{formatPrice(subtotal)}</b>
        </div>
        <div className="side-box">
          <div className="fgroup">
            <label>
              Delivery <span className="req">*</span>
            </label>
            <div className="seg">
              <button
                type="button"
                className={deliveryMethod === "SHIP" ? "on" : ""}
                onClick={() => setDeliveryMethod("SHIP")}
              >
                Ship to me
              </button>
              <button
                type="button"
                className={deliveryMethod === "PICKUP" ? "on" : ""}
                onClick={() => setDeliveryMethod("PICKUP")}
              >
                I&rsquo;ll pick up
              </button>
            </div>
            {submitTried && !deliveryMethod && <div className="err">Choose ship or pickup.</div>}
          </div>

          {deliveryMethod === "SHIP" && (
            <>
              {shipToOptions.length > 0 && (
                <div className="fgroup">
                  <label>Ship to</label>
                  <select value={shipToId} onChange={(e) => setShipToId(e.target.value)}>
                    {shipToOptions.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.label} — {s.line1}, {s.city}, {s.state}
                      </option>
                    ))}
                    <option value={NEW_ADDRESS}>+ Enter a new address</option>
                  </select>
                </div>
              )}

              {enteringNewAddress && (
                <div className="fgroup">
                  <label>
                    Shipping address <span className="req">*</span>
                  </label>
                  <input
                    type="text"
                    value={newAddress.label}
                    onChange={(e) => setNewAddress({ ...newAddress, label: e.target.value })}
                    placeholder="Name this address (optional) — e.g. Oak St jobsite"
                    style={{ marginBottom: 7 }}
                  />
                  <input
                    type="text"
                    value={newAddress.line1}
                    onChange={(e) => setNewAddress({ ...newAddress, line1: e.target.value })}
                    placeholder="Street address"
                    style={{ marginBottom: 7 }}
                  />
                  <input
                    type="text"
                    value={newAddress.line2}
                    onChange={(e) => setNewAddress({ ...newAddress, line2: e.target.value })}
                    placeholder="Suite / unit (optional)"
                    style={{ marginBottom: 7 }}
                  />
                  <input
                    type="text"
                    value={newAddress.city}
                    onChange={(e) => setNewAddress({ ...newAddress, city: e.target.value })}
                    placeholder="City"
                    style={{ marginBottom: 7 }}
                  />
                  <div style={{ display: "flex", gap: 7, marginBottom: 7 }}>
                    <input
                      type="text"
                      value={newAddress.state}
                      onChange={(e) => setNewAddress({ ...newAddress, state: e.target.value })}
                      placeholder="State"
                      style={{ flex: 1, minWidth: 0 }}
                    />
                    <input
                      type="text"
                      value={newAddress.zip}
                      onChange={(e) => setNewAddress({ ...newAddress, zip: e.target.value })}
                      placeholder="ZIP"
                      style={{ flex: 1, minWidth: 0 }}
                    />
                  </div>
                  <input
                    type="text"
                    value={newAddress.contactName}
                    onChange={(e) => setNewAddress({ ...newAddress, contactName: e.target.value })}
                    placeholder="Site contact name (optional)"
                    style={{ marginBottom: 7 }}
                  />
                  <input
                    type="text"
                    value={newAddress.contactPhone}
                    onChange={(e) => setNewAddress({ ...newAddress, contactPhone: e.target.value })}
                    placeholder="Site contact phone (optional)"
                  />
                  <div className="field-hint">
                    We&rsquo;ll save this address so you can reuse it on your next order.
                  </div>
                  {submitTried && !addressComplete(newAddress) && (
                    <div className="err">Street address, city, state, and ZIP are required.</div>
                  )}
                </div>
              )}
            </>
          )}

          {deliveryMethod === "PICKUP" && (
            <>
              <div className="fgroup">
                <label>
                  Pickup contact <span className="req">*</span>
                </label>
                <input
                  type="text"
                  value={pickupName}
                  onChange={(e) => setPickupName(e.target.value)}
                  placeholder="Name"
                  style={{ marginBottom: 7 }}
                />
                <input
                  type="text"
                  value={pickupPhone}
                  onChange={(e) => setPickupPhone(e.target.value)}
                  placeholder="Phone"
                />
                {submitTried && (!pickupName.trim() || !pickupPhone.trim()) && (
                  <div className="err">Name and phone are required for pickup.</div>
                )}
              </div>
              <div className="warehouse">
                <b>C&amp;G Wholesale warehouse</b>
                {warehouse.address}
                <br />
                {warehouse.hours} · {warehouse.phone}
              </div>
            </>
          )}

          <div className="fgroup">
            <label>
              PO number <span className="req">*</span>
            </label>
            <input
              type="text"
              value={po}
              onChange={(e) => setPo(e.target.value)}
              placeholder="Your job / PO reference"
            />
            {submitTried && !po.trim() && <div className="err">PO number is required.</div>}
          </div>
          <div className="fgroup">
            <label>Requested date</label>
            <input type="date" value={requestedDate} onChange={(e) => setRequestedDate(e.target.value)} />
          </div>
          <div className="fgroup">
            <label>Order notes</label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Anything we should know"
            />
          </div>
        </div>

        <div className="summary-line">{summary}</div>
        {error && <div className="err" style={{ marginBottom: 10 }}>{error}</div>}
        <button className="btn wide" onClick={trySubmit}>
          Submit Order
        </button>
      </div>

      {confirmOpen && (
        <div className="modal-wrap" onClick={() => !submitting && setConfirmOpen(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>Submit this order?</h2>
            <p>{summary}</p>
            <p>
              PO <b>{po}</b> · {lines.length} line{lines.length === 1 ? "" : "s"}
            </p>
            <div className="actions">
              <button className="btn ghost" disabled={submitting} onClick={() => setConfirmOpen(false)}>
                Go back
              </button>
              <button className="btn" disabled={submitting} onClick={confirmSubmit}>
                {submitting ? "Submitting…" : "Submit"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
