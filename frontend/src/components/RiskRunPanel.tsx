"use client";

import type { ChangeEvent, FormEvent } from "react";
import { useEffect, useState } from "react";

import { apiFetch } from "@/lib/api";
import type { RiskRun } from "@/types/risk";
import HistogramChart from "@/components/HistogramChart";

type RiskRunPanelProps = {
  strategyId: number;
  defaultSpot: number;
  defaultRate: number;
  defaultDividend: number;
  defaultSigma: number;
  defaultAsOf: string;
};

export default function RiskRunPanel({
  strategyId,
  defaultSpot,
  defaultRate,
  defaultDividend,
  defaultSigma,
  defaultAsOf,
}: RiskRunPanelProps) {
  const [horizonDays, setHorizonDays] = useState(30);
  const [paths, setPaths] = useState(5000);
  const [seed, setSeed] = useState(7);
  const [sigma, setSigma] = useState(defaultSigma);
  const [spot, setSpot] = useState(defaultSpot);
  const [rate, setRate] = useState(defaultRate);
  const [dividend, setDividend] = useState(defaultDividend);
  const [asOf, setAsOf] = useState(defaultAsOf);
  const [riskRun, setRiskRun] = useState<RiskRun | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setSigma(defaultSigma);
    setSpot(defaultSpot);
    setRate(defaultRate);
    setDividend(defaultDividend);
    setAsOf(defaultAsOf);
  }, [defaultSigma, defaultSpot, defaultRate, defaultDividend, defaultAsOf]);

  useEffect(() => {
    if (!riskRun || (riskRun.status !== "PENDING" && riskRun.status !== "RUNNING")) {
      return;
    }

    const timer = window.setTimeout(() => {
      apiFetch<RiskRun>(`/api/risk/${riskRun.id}/`)
        .then((data) => setRiskRun(data))
        .catch(() => {
          setError("Risk status check failed.");
        });
    }, 2000);

    return () => window.clearTimeout(timer);
  }, [riskRun]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const response = await apiFetch<{ risk_run_id: number }>("/api/risk/run/", {
        method: "POST",
        body: JSON.stringify({
          strategy_id: strategyId,
          spot,
          r: rate,
          q: dividend,
          sigma,
          as_of: asOf,
          horizon_days: horizonDays,
          paths,
          seed,
        }),
      });
      setRiskRun({
        id: response.risk_run_id,
        status: "PENDING",
        params: {},
        summary: null,
      });
    } catch (err) {
      const message =
        (err as { errors?: { detail?: string } })?.errors?.detail ||
        (err as { detail?: string })?.detail ||
        "Risk run failed.";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4 rounded-xl border border-ink bg-paper p-6">
      <div>
        <h3 className="text-lg font-semibold">Risk run (GBM)</h3>
        <p className="text-sm text-ink">
          Run a Monte Carlo summary using a simple GBM terminal distribution.
        </p>
      </div>
      <form className="grid gap-4 md:grid-cols-3" onSubmit={handleSubmit}>
        <label className="text-sm text-ink">
          Horizon (days)
          <input
            className="mt-2 w-full rounded-md border border-ink bg-paper px-2 py-1 text-sm"
            type="number"
            min={1}
            max={365}
            value={horizonDays}
            onChange={(event: ChangeEvent<HTMLInputElement>) =>
              setHorizonDays(Number(event.target.value))
            }
          />
        </label>
        <label className="text-sm text-ink">
          Paths
          <input
            className="mt-2 w-full rounded-md border border-ink bg-paper px-2 py-1 text-sm"
            type="number"
            min={100}
            max={100000}
            value={paths}
            onChange={(event: ChangeEvent<HTMLInputElement>) =>
              setPaths(Number(event.target.value))
            }
          />
        </label>
        <label className="text-sm text-ink">
          Seed
          <input
            className="mt-2 w-full rounded-md border border-ink bg-paper px-2 py-1 text-sm"
            type="number"
            value={seed}
            onChange={(event: ChangeEvent<HTMLInputElement>) =>
              setSeed(Number(event.target.value))
            }
          />
        </label>
        <label className="text-sm text-ink">
          Spot
          <input
            className="mt-2 w-full rounded-md border border-ink bg-paper px-2 py-1 text-sm"
            type="number"
            step="0.01"
            value={spot}
            onChange={(event: ChangeEvent<HTMLInputElement>) =>
              setSpot(Number(event.target.value))
            }
          />
        </label>
        <label className="text-sm text-ink">
          Sigma
          <input
            className="mt-2 w-full rounded-md border border-ink bg-paper px-2 py-1 text-sm"
            type="number"
            step="0.01"
            value={sigma}
            onChange={(event: ChangeEvent<HTMLInputElement>) =>
              setSigma(Number(event.target.value))
            }
          />
        </label>
        <label className="text-sm text-ink">
          As of
          <input
            className="mt-2 w-full rounded-md border border-ink bg-paper px-2 py-1 text-sm"
            type="date"
            value={asOf}
            onChange={(event: ChangeEvent<HTMLInputElement>) =>
              setAsOf(event.target.value)
            }
          />
        </label>
        <label className="text-sm text-ink">
          r
          <input
            className="mt-2 w-full rounded-md border border-ink bg-paper px-2 py-1 text-sm"
            type="number"
            step="0.001"
            value={rate}
            onChange={(event: ChangeEvent<HTMLInputElement>) =>
              setRate(Number(event.target.value))
            }
          />
        </label>
        <label className="text-sm text-ink">
          q
          <input
            className="mt-2 w-full rounded-md border border-ink bg-paper px-2 py-1 text-sm"
            type="number"
            step="0.001"
            value={dividend}
            onChange={(event: ChangeEvent<HTMLInputElement>) =>
              setDividend(Number(event.target.value))
            }
          />
        </label>
        <div className="flex items-end">
          <button
            className="w-full rounded-lg bg-ink px-4 py-2 text-sm font-semibold text-paper disabled:opacity-60"
            type="submit"
            disabled={loading}
          >
            {loading ? "Submitting..." : "Run risk"}
          </button>
        </div>
      </form>
      {error && <p className="text-xs text-accent">{error}</p>}
      {riskRun && (
        <div className="space-y-3 rounded-lg border border-ink px-3 py-2 text-xs text-ink">
          <p>Status: {riskRun.status}</p>
          {riskRun.status === "FAILED" && riskRun.error_message && (
            <p className="text-accent">{riskRun.error_message}</p>
          )}
          {riskRun.summary && (
            <div className="grid gap-2 md:grid-cols-2">
              <div>
                <p>Expected P/L: {riskRun.summary.expected_pl.toFixed(4)}</p>
                <p>POP: {(riskRun.summary.pop * 100).toFixed(2)}%</p>
              </div>
              <div>
                <p>VaR (5%): {riskRun.summary.var.toFixed(4)}</p>
                <p>CVaR (5%): {riskRun.summary.cvar.toFixed(4)}</p>
              </div>
            </div>
          )}
        </div>
      )}
      {riskRun?.summary?.histogram && (
        <HistogramChart
          bins={riskRun.summary.histogram.bins}
          counts={riskRun.summary.histogram.counts}
        />
      )}
    </div>
  );
}
