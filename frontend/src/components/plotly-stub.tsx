"use client";

import { useEffect, useRef } from "react";

type PlotlyStubProps = {
  title: string;
  seriesLabel: string;
  x: number[];
  y: number[];
};

export default function PlotlyStub({ title, seriesLabel, x, y }: PlotlyStubProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Render a lightweight Plotly stub chart on the client.
  useEffect(() => {
    let mounted = true;

    const renderChart = async () => {
      if (!containerRef.current) {
        return;
      }
      const Plotly = await import("plotly.js-dist-min");
      if (!mounted || !containerRef.current) {
        return;
      }
      await Plotly.newPlot(
        containerRef.current,
        [
          {
            x,
            y,
            type: "scatter",
            mode: "lines+markers",
            name: seriesLabel,
            line: { color: "#F62DAE" },
            marker: { color: "#F62DAE" },
          },
        ],
        {
          title: { text: title, font: { color: "#000000", size: 12 } },
          paper_bgcolor: "#FFFFFF",
          plot_bgcolor: "#FFFFFF",
          xaxis: { color: "#000000", gridcolor: "#000000" },
          yaxis: { color: "#000000", gridcolor: "#000000" },
          margin: { l: 30, r: 20, t: 30, b: 30 },
        },
        { displayModeBar: false, responsive: true }
      );
    };

    renderChart();

    return () => {
      mounted = false;
      if (containerRef.current) {
        import("plotly.js-dist-min").then((Plotly) => {
          Plotly.purge(containerRef.current as HTMLDivElement);
        });
      }
    };
  }, [title, seriesLabel, x, y]);

  return <div ref={containerRef} className="h-40 w-full" />;
}
