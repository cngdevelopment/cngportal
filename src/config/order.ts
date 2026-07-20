import type { Assembly, DeliveryMethod, PipelineStatus } from "@/types/domain";

/**
 * Order status + order-type display metadata.
 *
 * NOTE: the pipeline itself (which statuses exist, in what order, with
 * what step labels) is owned exclusively by buildPipeline() — the single
 * source of truth (spec §7). This file only holds *display* concerns:
 * chip colors and the labels for off-pipeline states and order types.
 */

// Colour semantics (spec: avoid red=failure confusion on order status):
//   neutral = in progress · green = success · amber = needs attention · red = failure
export type ChipVariant = "neutral" | "green" | "amber" | "red" | "default";

/** Chip styling + label for statuses that never appear on the pipeline. */
export const OFF_PIPELINE_STATUS_META = {
  DRAFT: { label: "Draft", chip: "default" },
  ON_HOLD: { label: "On Hold", chip: "amber" },
  CANCELLED: { label: "Cancelled", chip: "red" },
} as const satisfies Record<string, { label: string; chip: ChipVariant }>;

/**
 * Chip colour for an on-pipeline status. Success states (ready/delivered) are
 * green; everything still in flight is neutral — never red, so red is reserved
 * for genuine failure (cancelled).
 */
export function pipelineChipVariant(status: PipelineStatus): ChipVariant {
  return status === "READY" || status === "COMPLETED" ? "green" : "neutral";
}

export const DELIVERY_LABELS: Record<DeliveryMethod, string> = {
  SHIP: "Ship",
  PICKUP: "Pickup",
};

export const ASSEMBLY_LABELS: Record<Assembly, string> = {
  ASSEMBLED: "Assembled",
  UNASSEMBLED: "Unassembled",
};
