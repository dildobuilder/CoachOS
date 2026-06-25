import type { WeightTrendPoint } from "@/features/client-progress/queries";

type WeightTrendChartProps = {
  points: WeightTrendPoint[];
};

export function WeightTrendChart({ points }: WeightTrendChartProps) {
  if (points.length === 0) {
    return (
      <div className="flex h-44 items-center justify-center rounded-md border border-dashed text-sm text-muted-foreground">
        Данных по весу пока нет
      </div>
    );
  }

  const width = 640;
  const height = 180;
  const padding = 24;
  const weights = points.map((point) => point.weight);
  const minWeight = Math.min(...weights);
  const maxWeight = Math.max(...weights);
  const range = Math.max(maxWeight - minWeight, 1);
  const coords = points.map((point, index) => {
    const x = points.length === 1 ? width / 2 : padding + (index / (points.length - 1)) * (width - padding * 2);
    const y = height - padding - ((point.weight - minWeight) / range) * (height - padding * 2);

    return { ...point, x, y };
  });
  const path = coords.map((point, index) => `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`).join(" ");

  return (
    <div className="rounded-md border bg-background p-3">
      <svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label="График веса клиента" className="h-44 w-full">
        <line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} className="stroke-border" />
        <line x1={padding} y1={padding} x2={padding} y2={height - padding} className="stroke-border" />
        {points.length > 1 ? <path d={path} fill="none" className="stroke-primary" strokeWidth="3" strokeLinecap="round" /> : null}
        {coords.map((point) => (
          <g key={`${point.date}-${point.weight}`}>
            <circle cx={point.x} cy={point.y} r="4" className="fill-primary" />
            <title>{`${formatDate(point.date)} · ${point.weight} кг`}</title>
          </g>
        ))}
      </svg>
      <div className="mt-2 flex justify-between text-xs text-muted-foreground">
        <span>{formatDate(points[0].date)}</span>
        <span>{formatDate(points.at(-1)?.date ?? points[0].date)}</span>
      </div>
    </div>
  );
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("ru-RU", {
    day: "2-digit",
    month: "short"
  }).format(new Date(`${value}T00:00:00.000Z`));
}
