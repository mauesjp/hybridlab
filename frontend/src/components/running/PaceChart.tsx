import type { RunningActivity } from "../../types/running";
import { formatPace, formatFullDate } from "./runningModel";
export default function PaceChart({ activities }: { activities: RunningActivity[] }) {
  const data = [...activities]
    .sort((a, b) => a.activityDate.localeCompare(b.activityDate))
    .slice(-12);

  if (data.length < 2) {
    return (
      <div className="rounded-xl border border-border p-5 text-sm text-muted">
        Registre pelo menos duas corridas para visualizar a evolução do pace.
      </div>
    );
  }

  const width = 720;
  const height = 230;
  const paddingX = 42;
  const paddingY = 30;

  const values = data.map((item) => item.averagePaceSecondsPerKm);

  const min = Math.min(...values);

  const max = Math.max(...values);

  const range = max - min || 1;

  const chartWidth = width - paddingX * 2;

  const chartHeight = height - paddingY * 2;

  const points = data.map((activity, index) => ({
    ...activity,

    x: paddingX + (index / (data.length - 1)) * chartWidth,

    y:
      paddingY +
      ((activity.averagePaceSecondsPerKm - min) / range) * chartHeight,
  }));

  return (
    <div className="overflow-x-auto">
      <svg viewBox={`0 0 ${width} ${height}`} className="min-w-[620px] w-full" role="img" aria-label="Evolução do pace nas últimas corridas">
        <polyline
          points={points.map((point) => `${point.x},${point.y}`).join(" ")}
          fill="none"
          stroke="currentColor"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {points.map((point) => (
          <g key={point.id}>
            <title>{formatFullDate(point.activityDate)}: {formatPace(point.averagePaceSecondsPerKm)}</title><circle cx={point.x} cy={point.y} r="5" fill="currentColor" />

            <text
              x={point.x}
              y={point.y - 10}
              textAnchor="middle"
              fill="currentColor"
              fontSize="11"
            >
              {formatPace(point.averagePaceSecondsPerKm).replace("/km", "")}
            </text>
          </g>
        ))}
      </svg>

      <p className="mt-2 text-xs text-muted">
        Últimas 12 corridas. Quanto menor o pace, mais rápida foi a corrida.
      </p>
    </div>
  );
}

