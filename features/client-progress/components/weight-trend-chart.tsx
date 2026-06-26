"use client";

import { useState } from "react";
import type { WeightTrendPoint } from "@/features/client-progress/queries";

type WeightTrendChartProps = {
  points: WeightTrendPoint[];
};

type ChartPoint = WeightTrendPoint & {
  x: number;
  y: number;
};

export function WeightTrendChart({ points }: WeightTrendChartProps) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

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
  const activePoint = activeIndex === null ? null : coords[activeIndex];
  const path = coords.map((point, index) => `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`).join(" ");

  return (
    <div className="rounded-md border bg-background p-3">
      <div
        className="relative"
        onPointerLeave={(event) => {
          if (event.pointerType === "mouse") {
            setActiveIndex(null);
          }
        }}
      >
        <svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label="График веса клиента" className="h-44 w-full">
          <line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} className="stroke-border" />
          <line x1={padding} y1={padding} x2={padding} y2={height - padding} className="stroke-border" />
          {points.length > 1 ? <path d={path} fill="none" className="stroke-primary" strokeWidth="3" strokeLinecap="round" /> : null}
          {coords.map((point, index) => (
            <circle
              key={`${point.date}-${point.weight}`}
              cx={point.x}
              cy={point.y}
              r={activeIndex === index ? "5" : "4"}
              className={activeIndex === index ? "fill-primary stroke-primary/20" : "fill-primary"}
              strokeWidth="8"
            />
          ))}
        </svg>

        {coords.map((point, index) => (
          <button
            key={`${point.date}-${point.weight}-target`}
            type="button"
            aria-label={`${formatFullDate(point.date)}, ${point.weight} кг`}
            className="absolute h-8 w-8 -translate-x-1/2 -translate-y-1/2 rounded-full outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
            style={{
              left: `${(point.x / width) * 100}%`,
              top: `${(point.y / height) * 100}%`
            }}
            onPointerEnter={() => setActiveIndex(index)}
            onPointerLeave={(event) => {
              if (event.pointerType === "mouse") {
                setActiveIndex(null);
              }
            }}
            onFocus={() => setActiveIndex(index)}
            onBlur={() => setActiveIndex(null)}
            onClick={() => setActiveIndex(index)}
          />
        ))}

        {activePoint ? <Tooltip point={activePoint} width={width} height={height} /> : null}
      </div>
      <div className="mt-2 flex justify-between text-xs text-muted-foreground">
        <span>{formatDate(points[0].date)}</span>
        <span>{formatDate(points.at(-1)?.date ?? points[0].date)}</span>
      </div>
    </div>
  );
}

function Tooltip({ point, width, height }: { point: ChartPoint; width: number; height: number }) {
  return (
    <div
      className="pointer-events-none absolute z-10 min-w-32 rounded-md border bg-background px-3 py-2 text-xs shadow-md"
      style={{
        left: `${(point.x / width) * 100}%`,
        top: `${(point.y / height) * 100}%`,
        transform: getTooltipTransform(point.x, width)
      }}
    >
      <div className="font-medium">{formatFullDate(point.date)}</div>
      <div className="mt-1 text-muted-foreground">Вес: {point.weight} кг</div>
    </div>
  );
}

function getTooltipTransform(x: number, width: number) {
  if (x < width * 0.2) {
    return "translate(0, -115%)";
  }

  if (x > width * 0.8) {
    return "translate(-100%, -115%)";
  }

  return "translate(-50%, -115%)";
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("ru-RU", {
    day: "2-digit",
    month: "short"
  }).format(new Date(`${value}T00:00:00.000Z`));
}

function formatFullDate(value: string) {
  return new Intl.DateTimeFormat("ru-RU", {
    day: "2-digit",
    month: "long",
    year: "numeric"
  }).format(new Date(`${value}T00:00:00.000Z`));
}
