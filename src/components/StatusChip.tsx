import { buildPipeline, type PipelineStatus } from "@/lib/pipeline/buildPipeline";
import { OFF_PIPELINE_STATUS_META, pipelineChipVariant, type ChipVariant } from "@/config/order";
import type { DeliveryMethod } from "@/types/domain";

function chipClass(variant: ChipVariant): string {
  return variant === "default" ? "chip" : `chip ${variant}`;
}

export function StatusChip({
  status,
  requiresAssembly,
  deliveryMethod,
}: {
  status: string;
  requiresAssembly: boolean;
  deliveryMethod: DeliveryMethod;
}) {
  const offPipeline = OFF_PIPELINE_STATUS_META[status as keyof typeof OFF_PIPELINE_STATUS_META];
  if (offPipeline) {
    return <span className={chipClass(offPipeline.chip)}>{offPipeline.label}</span>;
  }

  const step = buildPipeline({ requiresAssembly, deliveryMethod }).find(
    (s) => s.status === (status as PipelineStatus)
  );
  if (!step) return <span className="chip">{status}</span>;
  return <span className={chipClass(pipelineChipVariant(status as PipelineStatus))}>{step.label}</span>;
}
