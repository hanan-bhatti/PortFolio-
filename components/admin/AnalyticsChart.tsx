/**
 * @file components/admin/AnalyticsChart.tsx
 * @description Next.js React client component wrapper for Chart.js.
 * Safe to render in Server Components since Chart.js is dynamically imported client-side.
 * 
 * @exports
 * - AnalyticsChart (default): React client component
 */

"use client";

import { useEffect, useRef } from "react";
import type { ChartConfiguration } from "chart.js";

interface AnalyticsChartProps {
  type: "bar" | "line" | "doughnut" | "pie";
  data: any;
  options?: any;
  height?: number;
}

export default function AnalyticsChart({
  type,
  data,
  options = {},
  height = 250,
}: AnalyticsChartProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const chartInstanceRef = useRef<any>(null);

  useEffect(() => {
    let active = true;

    const initChart = async () => {
      const { Chart } = await import("chart.js/auto");
      
      if (!active || !canvasRef.current) return;

      // Clean up previous instance if it exists
      if (chartInstanceRef.current) {
        chartInstanceRef.current.destroy();
        chartInstanceRef.current = null;
      }

      // Default dark theme configs
      const defaultOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: type === "doughnut" || type === "pie",
            labels: {
              color: "#a1a1aa",
              font: {
                family: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
                size: 10,
              },
              boxWidth: 8,
              boxHeight: 8,
              padding: 12,
            },
          },
          tooltip: {
            backgroundColor: "#000000",
            titleColor: "#ffffff",
            bodyColor: "#d4d4d8",
            borderColor: "#262626",
            borderWidth: 1,
            borderRadius: 0,
            padding: 8,
            titleFont: {
              family: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
              size: 11,
              weight: "bold" as const,
            },
            bodyFont: {
              family: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
              size: 10,
            },
          },
        },
        scales:
          type === "doughnut" || type === "pie"
            ? undefined
            : {
                x: {
                  grid: {
                    color: "rgba(38, 38, 38, 0.4)",
                  },
                  ticks: {
                    color: "#71717a",
                    font: {
                      family: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
                      size: 9,
                    },
                  },
                  border: {
                    color: "#262626",
                  },
                },
                y: {
                  grid: {
                    color: "rgba(38, 38, 38, 0.4)",
                  },
                  ticks: {
                    color: "#71717a",
                    font: {
                      family: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
                      size: 9,
                    },
                  },
                  border: {
                    color: "#262626",
                  },
                },
              },
      };

      // Merge defaults with custom options
      const mergedOptions = {
        ...defaultOptions,
        ...options,
        plugins: {
          ...defaultOptions.plugins,
          ...(options.plugins || {}),
          legend: {
            ...defaultOptions.plugins.legend,
            ...(options.plugins?.legend || {}),
            labels: {
              ...defaultOptions.plugins.legend.labels,
              ...(options.plugins?.legend?.labels || {}),
            },
          },
          tooltip: {
            ...defaultOptions.plugins.tooltip,
            ...(options.plugins?.tooltip || {}),
          },
        },
        scales:
          type === "doughnut" || type === "pie"
            ? undefined
            : {
                x: {
                  ...defaultOptions.scales?.x,
                  ...(options.scales?.x || {}),
                  grid: {
                    ...defaultOptions.scales?.x?.grid,
                    ...(options.scales?.x?.grid || {}),
                  },
                  ticks: {
                    ...defaultOptions.scales?.x?.ticks,
                    ...(options.scales?.x?.ticks || {}),
                  },
                  border: {
                    ...defaultOptions.scales?.x?.border,
                    ...(options.scales?.x?.border || {}),
                  },
                },
                y: {
                  ...defaultOptions.scales?.y,
                  ...(options.scales?.y || {}),
                  grid: {
                    ...defaultOptions.scales?.y?.grid,
                    ...(options.scales?.y?.grid || {}),
                  },
                  ticks: {
                    ...defaultOptions.scales?.y?.ticks,
                    ...(options.scales?.y?.ticks || {}),
                  },
                  border: {
                    ...defaultOptions.scales?.y?.border,
                    ...(options.scales?.y?.border || {}),
                  },
                },
              },
      };

      chartInstanceRef.current = new Chart(canvasRef.current, {
        type,
        data,
        options: mergedOptions,
      } as ChartConfiguration);
    };

    initChart();

    return () => {
      active = false;
      if (chartInstanceRef.current) {
        chartInstanceRef.current.destroy();
        chartInstanceRef.current = null;
      }
    };
  }, [type, data, options]);

  return (
    <div style={{ height: `${height}px` }} className="relative w-full">
      <canvas ref={canvasRef} />
    </div>
  );
}
