"use client";

import { useEffect, useRef } from "react";
import Plotly from "plotly.js-dist-min";

type HistogramChartProps = {
  bins: number[];
  counts: number[];
};

export default function HistogramChart({ bins, counts }: HistogramChartProps) {
  const chartRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!chartRef.current || bins.length < 2 || counts.length === 0) {
      return;
    }

    const midpoints = bins.slice(0, -1).map((value, index) => {
      const next = bins[index + 1];
      return (value + next) / 2;
    });

    const data = [
      {
        x: midpoints,
        y: counts,
        type: "bar",
        marker: { color: "#000000" },
      },
    ];

    const layout = {
      margin: { l: 40, r: 20, t: 20, b: 40 },
      paper_bgcolor: "#FFFFFF",
      plot_bgcolor: "#FFFFFF",
      xaxis: { title: "P/L" },
      yaxis: { title: "Count" },
      showlegend: false,
    };

    Plotly.react(chartRef.current, data, layout, {
      displayModeBar: false,
      responsive: true,
    });

    return () => {
      if (chartRef.current) {
        Plotly.purge(chartRef.current);
      }
    };
  }, [bins, counts]);

  if (bins.length < 2 || counts.length === 0) {
    return (
      <div className="rounded-xl border border-ink bg-paper p-6 text-sm text-ink">
        No distribution data yet.
      </div>
    );
  }

  return <div ref={chartRef} className="h-64 w-full" />;
}
