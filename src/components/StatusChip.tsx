import { buildPipeline, type PipelineStatus } from "@/lib/pipeline/buildPipeline";

export function StatusChip({
  status,
  requiresAssembly,
  deliveryMethod,
}: {
  status: string;
  requiresAssembly: boolean;
  deliveryMethod: "SHIP" | "PICKUP";
}) {
  if (status === "ON_HOLD") return <span className="chip amber">On Hold</span>;
  if (status === "CANCELLED") return <span className="chip">Cancelled</span>;
  const steps = buildPipeline({ requiresAssembly, deliveryMethod });
  const step = steps.find((s) => s.status === (status as PipelineStatus));
  if (!step) return <span className="chip">{status}</span>;
  const cls = status === "COMPLETED" ? "chip green" : "chip navy";
  return <span className={cls}>{step.label}</span>;
}
