"use client";

import { useEffect, useMemo, useRef } from "react";
import Plotly from "plotly.js-dist-min";

type PayoffChartProps = {
  grid: number[];
  pnl: number[];
  breakevens: number[];
  spot: number;
};

export default function PayoffChart({ grid, pnl, breakevens, spot }: PayoffChartProps) {
  const chartRef = useRef<HTMLDivElement | null>(null);

  const shapes = useMemo(() => {
    if (pnl.length === 0) {
      return [];
    }
    const beLines = breakevens.map((value) => ({
      type: "line",
      x0: value,
      x1: value,
      y0: Math.min(...pnl, 0),
      y1: Math.max(...pnl, 0),
      line: { color: "#F62DAE", width: 1, dash: "dot" },
    }));
    return beLines;
  }, [breakevens, pnl]);

  useEffect(() => {
    if (!chartRef.current || grid.length === 0 || pnl.length === 0) {
      return;
    }

    const data = [
      {
        x: grid,
        y: pnl,
        type: "scatter",
        mode: "lines",
        line: { color: "#000000", width: 2 },
        name: "Payoff",
      },
      {
        x: [spot],
        y: [0],
        type: "scatter",
        mode: "markers",
        marker: { color: "#F62DAE", size: 8 },
        name: "Spot",
      },
    ];

    const layout = {
      margin: { l: 40, r: 20, t: 20, b: 40 },
      paper_bgcolor: "#FFFFFF",
      plot_bgcolor: "#FFFFFF",
      xaxis: { title: "Spot at expiry", zeroline: false },
      yaxis: { title: "Payoff", zeroline: true, zerolinecolor: "#000000" },
      showlegend: false,
      shapes,
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
  }, [grid, pnl, shapes, spot]);

  if (grid.length === 0 || pnl.length === 0) {
    return (
      <div className="rounded-xl border border-ink bg-paper p-6 text-sm text-ink">
        No payoff data yet.
      </div>
    );
  }

  return <div ref={chartRef} className="h-72 w-full" />;
}
