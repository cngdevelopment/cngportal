import type { Assembly, DeliveryMethod, PipelineStatus } from "@/types/domain";

/**
 * Order status + order-type display metadata.
 *
 * NOTE: the pipeline itself (which statuses exist, in what order, with
 * what step labels) is owned exclusively by buildPipeline() — the single
 * source of truth (spec §7). This file only holds *display* concerns:
 * chip colors and the labels for off-pipeline states and order types.
 */

export type ChipVariant = "red" | "green" | "amber" | "default";

/** Chip styling + label for statuses that never appear on the pipeline. */
export const OFF_PIPELINE_STATUS_META = {
  DRAFT: { label: "Draft", chip: "default" },
  ON_HOLD: { label: "On Hold", chip: "amber" },
  CANCELLED: { label: "Cancelled", chip: "default" },
} as const satisfies Record<string, { label: string; chip: ChipVariant }>;

/** Chip color for an on-pipeline status (terminal = green, otherwise red). */
export function pipelineChipVariant(status: PipelineStatus): ChipVariant {
  return status === "COMPLETED" ? "green" : "red";
}

export const DELIVERY_LABELS: Record<DeliveryMethod, string> = {
  SHIP: "Ship",
  PICKUP: "Pickup",
};

export const ASSEMBLY_LABELS: Record<Assembly, string> = {
  ASSEMBLED: "Assembled",
  UNASSEMBLED: "Unassembled",
};
