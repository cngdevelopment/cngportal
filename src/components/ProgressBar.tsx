import { buildPipeline, type PipelineStatus } from "@/lib/pipeline/buildPipeline";

/**
 * Renders whatever buildPipeline() returns — no pipeline rules live here
 * (spec §7). Server component; no client JS needed.
 */
export function ProgressBar({
  requiresAssembly,
  deliveryMethod,
  status,
  stepTimes = {},
}: {
  requiresAssembly: boolean;
  deliveryMethod: "SHIP" | "PICKUP";
  status: string;
  stepTimes?: Partial<Record<string, string>>;
}) {
  if (status === "CANCELLED") {
    return <div className="meta" style={{ marginTop: 12 }}>This order was cancelled.</div>;
  }
  const steps = buildPipeline({ requiresAssembly, deliveryMethod });
  const idx = steps.findIndex((s) => s.status === (status as PipelineStatus));

  return (
    <div className="pipe">
      {steps.map((s, i) => {
        const cls =
          i < idx ? "done" : i === idx ? (status === "COMPLETED" ? "done" : "now") : "";
        const t = stepTimes[s.status];
        return (
          <div key={s.status} className={`step ${cls}`}>
            <div className="dot" />
            <div className="slabel">{s.label}</div>
            {t && i <= idx ? <div className="stime">{t}</div> : null}
          </div>
        );
      })}
    </div>
  );
}
