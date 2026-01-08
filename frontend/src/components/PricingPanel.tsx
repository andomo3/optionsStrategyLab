"use client";

import type { ChangeEvent } from "react";
import { useEffect, useMemo, useState } from "react";

import { apiFetch } from "@/lib/api";
import type { PricingPreviewResponse } from "@/types/pricing";

type PricingAssumptions = {
  spot: number;
  r: number;
  q: number;
  asOf: string;
  globalIv: number;
};

type PricingPanelProps = {
  strategyId: number;
  legs: { id: number; right: "call" | "put" }[];
  spotShift?: number;
  volShift?: number;
  timeShiftDays?: number;
  assumptions?: PricingAssumptions;
  onAssumptionsChange?: (assumptions: PricingAssumptions) => void;
  onResult?: (result: PricingPreviewResponse | null) => void;
};

type Overrides = Record<string, { iv?: number }>;

const addDays = (dateStr: string, days: number) => {
  if (!days) {
    return dateStr;
  }
  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) {
    return dateStr;
  }
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
};

export default function PricingPanel({
  strategyId,
  legs,
  spotShift = 0,
  volShift = 0,
  timeShiftDays = 0,
  assumptions,
  onAssumptionsChange,
  onResult,
}: PricingPanelProps) {
  const [spot, setSpot] = useState(assumptions?.spot ?? 100);
  const [rate, setRate] = useState(assumptions?.r ?? 0.02);
  const [dividend, setDividend] = useState(assumptions?.q ?? 0.0);
  const [asOf, setAsOf] = useState(assumptions?.asOf ?? new Date().toISOString().slice(0, 10));
  const [ivMode, setIvMode] = useState<"global" | "per_leg">("global");
  const [globalIv, setGlobalIv] = useState(assumptions?.globalIv ?? 0.25);
  const [overrides, setOverrides] = useState<Overrides>({});
  const [result, setResult] = useState<PricingPreviewResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!assumptions) {
      return;
    }
    setSpot(assumptions.spot);
    setRate(assumptions.r);
    setDividend(assumptions.q);
    setAsOf(assumptions.asOf);
    setGlobalIv(assumptions.globalIv);
  }, [assumptions?.spot, assumptions?.r, assumptions?.q, assumptions?.asOf, assumptions?.globalIv]);

  useEffect(() => {
    onAssumptionsChange?.({
      spot,
      r: rate,
      q: dividend,
      asOf,
      globalIv,
    });
  }, [spot, rate, dividend, asOf, globalIv, onAssumptionsChange]);

  const adjusted = useMemo(() => {
    const shiftedSpot = spot * (1 + spotShift / 100);
    const shiftedIv = globalIv + volShift / 100;
    const shiftedAsOf = addDays(asOf, timeShiftDays);
    return {
      spot: shiftedSpot,
      r: rate,
      q: dividend,
      as_of: shiftedAsOf,
      global_iv: shiftedIv,
    };
  }, [spot, spotShift, globalIv, volShift, asOf, timeShiftDays, rate, dividend]);

  // Debounce pricing preview calls to avoid request bursts.
  useEffect(() => {
    const timer = window.setTimeout(() => {
      setLoading(true);
      setError(null);
      apiFetch<PricingPreviewResponse>("/api/pricing/preview/", {
        method: "POST",
        body: JSON.stringify({
          strategy_id: strategyId,
          spot: adjusted.spot,
          r: adjusted.r,
          q: adjusted.q,
          as_of: adjusted.as_of,
          iv_mode: ivMode,
          global_iv: adjusted.global_iv,
          leg_overrides: overrides,
        }),
      })
        .then((data) => {
          setResult(data);
          onResult?.(data);
        })
        .catch((err) => {
          const message =
            (err as { errors?: { detail?: string } })?.errors?.detail ||
            (err as { detail?: string })?.detail ||
            "Pricing preview failed.";
          setError(message);
          onResult?.(null);
        })
        .finally(() => setLoading(false));
    }, 500);

    return () => window.clearTimeout(timer);
  }, [strategyId, adjusted, ivMode, overrides, onResult]);

  const handleOverrideChange = (legId: number, value: string) => {
    const numeric = value ? Number(value) : undefined;
    setOverrides((prev) => ({
      ...prev,
      [legId]: { iv: numeric },
    }));
  };

  return (
    <div className="space-y-4 rounded-xl border border-ink bg-paper p-6">
      <div>
        <h3 className="text-lg font-semibold">Pricing preview</h3>
        <p className="text-sm text-ink">
          Live preview using Black-Scholes assumptions.
        </p>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
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
        <label className="text-sm text-ink">
          As of
          <input
            className="mt-2 w-full rounded-md border border-ink bg-paper px-2 py-1 text-sm"
            type="date"
            value={asOf}
            onChange={(event: ChangeEvent<HTMLInputElement>) => setAsOf(event.target.value)}
          />
        </label>
        <label className="text-sm text-ink">
          IV mode
          <select
            className="mt-2 w-full rounded-md border border-ink bg-paper px-2 py-1 text-sm"
            value={ivMode}
            onChange={(event: ChangeEvent<HTMLSelectElement>) =>
              setIvMode(event.target.value as "global" | "per_leg")
            }
          >
            <option value="global">Global IV</option>
            <option value="per_leg">Per-leg IV</option>
          </select>
        </label>
        <label className="text-sm text-ink">
          Global IV
          <input
            className="mt-2 w-full rounded-md border border-ink bg-paper px-2 py-1 text-sm"
            type="number"
            step="0.01"
            value={globalIv}
            onChange={(event: ChangeEvent<HTMLInputElement>) =>
              setGlobalIv(Number(event.target.value))
            }
          />
        </label>
      </div>
      <div className="rounded-lg border border-ink px-3 py-2 text-xs text-ink">
        Effective spot: {adjusted.spot.toFixed(2)} | Effective IV: {adjusted.global_iv.toFixed(3)} | As of: {adjusted.as_of}
      </div>
      {ivMode === "per_leg" && (
        <div className="space-y-2">
          <p className="text-sm text-ink">Per-leg IV overrides</p>
          <div className="grid gap-3 md:grid-cols-3">
            {legs.map((leg) => (
              <label key={leg.id} className="text-sm text-ink">
                Leg {leg.id} ({leg.right})
                <input
                  className="mt-2 w-full rounded-md border border-ink bg-paper px-2 py-1 text-sm"
                  type="number"
                  step="0.01"
                  value={overrides[leg.id]?.iv ?? ""}
                  onChange={(event: ChangeEvent<HTMLInputElement>) =>
                    handleOverrideChange(leg.id, event.target.value)
                  }
                />
              </label>
            ))}
          </div>
        </div>
      )}
      {loading && <p className="text-xs text-ink">Updating preview...</p>}
      {error && <p className="text-xs text-accent">{error}</p>}
      {result && (
        <div className="rounded-lg border border-ink p-3 text-xs text-ink">
          Cached: {result.cached ? "yes" : "no"} | Totals price: {result.totals.price.toFixed(4)}
        </div>
      )}
    </div>
  );
}
