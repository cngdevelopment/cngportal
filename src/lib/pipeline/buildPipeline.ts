/**
 * buildPipeline() — spec §7.
 *
 * The ONE pure function that derives an order's progress pipeline from
 * `requires_assembly` × `delivery_method`. The progress bar component,
 * the staff status dropdown, and the server-side transition validator
 * all consume this function so they can never disagree.
 *
 * Do NOT branch on these rules anywhere else.
 */

export type DeliveryMethod = "SHIP" | "PICKUP";

export type PipelineStatus =
  | "SUBMITTED"
  | "PROCESSING"
  | "ASSEMBLING"
  | "READY"
  | "OUT_FOR_DELIVERY"
  | "COMPLETED";

export type OrderStatus =
  | "DRAFT"
  | PipelineStatus
  | "ON_HOLD"
  | "CANCELLED";

export interface Step {
  status: PipelineStatus;
  label: string;
}

export interface PipelineInput {
  requiresAssembly: boolean;
  deliveryMethod: DeliveryMethod;
}

export function buildPipeline({
  requiresAssembly,
  deliveryMethod,
}: PipelineInput): Step[] {
  const ship = deliveryMethod === "SHIP";
  const steps: Step[] = [
    { status: "SUBMITTED", label: "Received" },
    { status: "PROCESSING", label: "Being Processed" },
  ];
  if (requiresAssembly) {
    steps.push({ status: "ASSEMBLING", label: "Being Built" });
  }
  steps.push({
    status: "READY",
    label: ship ? "Ready to Ship" : "Ready for Pickup",
  });
  if (ship) {
    steps.push({ status: "OUT_FOR_DELIVERY", label: "Out for Delivery" });
  }
  steps.push({ status: "COMPLETED", label: ship ? "Delivered" : "Picked Up" });
  return steps;
}

/**
 * Legal forward transition map derived from the pipeline (spec §7).
 * Staff may also move backward exactly one step (with a required reason),
 * and ON_HOLD / CANCELLED are reachable from any non-terminal status —
 * enforce those rules in the caller with `previousStep()` below.
 */
export function nextStatus(
  input: PipelineInput,
  current: PipelineStatus
): PipelineStatus | null {
  const steps = buildPipeline(input);
  const i = steps.findIndex((s) => s.status === current);
  if (i === -1 || i === steps.length - 1) return null;
  return steps[i + 1].status;
}

export function previousStep(
  input: PipelineInput,
  current: PipelineStatus
): PipelineStatus | null {
  const steps = buildPipeline(input);
  const i = steps.findIndex((s) => s.status === current);
  if (i <= 0) return null;
  return steps[i - 1].status;
}

/** Label for a status under a given delivery method (for emails, chips). */
export function statusLabel(
  input: PipelineInput,
  status: PipelineStatus
): string | null {
  const step = buildPipeline(input).find((s) => s.status === status);
  return step ? step.label : null;
}

export function isValidTransition(
  input: PipelineInput,
  from: PipelineStatus,
  to: PipelineStatus,
  opts: { isStaff: boolean; reason?: string }
): boolean {
  // Forward one step: staff only
  if (opts.isStaff && nextStatus(input, from) === to) return true;
  // Backward one step: staff only, reason required
  if (opts.isStaff && previousStep(input, from) === to && !!opts.reason)
    return true;
  return false;
}
