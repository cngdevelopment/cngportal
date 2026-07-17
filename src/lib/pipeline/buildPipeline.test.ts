import { describe, it, expect } from "vitest";
import {
  buildPipeline,
  nextStatus,
  previousStep,
  isValidTransition,
} from "./buildPipeline";

// Spec §12.9: unit test covering all four combinations of
// requires_assembly × delivery_method — step count, order, and labels.

describe("buildPipeline — all four variants (spec §7)", () => {
  it("SHIP + assembly → 6 steps", () => {
    const s = buildPipeline({ requiresAssembly: true, deliveryMethod: "SHIP" });
    expect(s.map((x) => x.label)).toEqual([
      "Received",
      "Being Processed",
      "Being Built",
      "Ready to Ship",
      "Out for Delivery",
      "Delivered",
    ]);
  });

  it("SHIP + no assembly → 5 steps", () => {
    const s = buildPipeline({ requiresAssembly: false, deliveryMethod: "SHIP" });
    expect(s.map((x) => x.label)).toEqual([
      "Received",
      "Being Processed",
      "Ready to Ship",
      "Out for Delivery",
      "Delivered",
    ]);
  });

  it("PICKUP + assembly → 5 steps", () => {
    const s = buildPipeline({ requiresAssembly: true, deliveryMethod: "PICKUP" });
    expect(s.map((x) => x.label)).toEqual([
      "Received",
      "Being Processed",
      "Being Built",
      "Ready for Pickup",
      "Picked Up",
    ]);
  });

  it("PICKUP + no assembly → 4 steps", () => {
    const s = buildPipeline({ requiresAssembly: false, deliveryMethod: "PICKUP" });
    expect(s.map((x) => x.label)).toEqual([
      "Received",
      "Being Processed",
      "Ready for Pickup",
      "Picked Up",
    ]);
  });

  it("never renders inapplicable steps", () => {
    const pickup = buildPipeline({ requiresAssembly: false, deliveryMethod: "PICKUP" });
    expect(pickup.some((s) => s.status === "OUT_FOR_DELIVERY")).toBe(false);
    expect(pickup.some((s) => s.status === "ASSEMBLING")).toBe(false);
  });
});

describe("transition map derives from the same pipeline", () => {
  const ship = { requiresAssembly: true, deliveryMethod: "SHIP" as const };
  const pickup = { requiresAssembly: false, deliveryMethod: "PICKUP" as const };

  it("forward transitions follow pipeline order", () => {
    expect(nextStatus(ship, "SUBMITTED")).toBe("PROCESSING");
    expect(nextStatus(ship, "PROCESSING")).toBe("ASSEMBLING");
    expect(nextStatus(pickup, "PROCESSING")).toBe("READY"); // skips ASSEMBLING
    expect(nextStatus(pickup, "READY")).toBe("COMPLETED"); // skips OUT_FOR_DELIVERY
    expect(nextStatus(ship, "COMPLETED")).toBeNull();
  });

  it("backward one step allowed for staff with reason only", () => {
    expect(previousStep(ship, "READY")).toBe("ASSEMBLING");
    expect(
      isValidTransition(ship, "READY", "ASSEMBLING", { isStaff: true, reason: "fix" })
    ).toBe(true);
    expect(
      isValidTransition(ship, "READY", "ASSEMBLING", { isStaff: true })
    ).toBe(false); // no reason
    expect(
      isValidTransition(ship, "READY", "ASSEMBLING", { isStaff: false, reason: "x" })
    ).toBe(false); // not staff
    expect(
      isValidTransition(ship, "SUBMITTED", "READY", { isStaff: true })
    ).toBe(false); // skipping steps
  });
});
