"use client";

import type { ChangeEvent, FormEvent } from "react";
import { useEffect, useMemo, useState } from "react";

import PlotlyStub from "@/components/plotly-stub";

type StrategyLeg = {
  id: number;
  name: string;
};

type Strategy = {
  id: number;
  name: string;
  strategy_kind: string;
  created_at: string;
  legs: StrategyLeg[];
};

type PricingRun = {
  id: number;
  created_at: string;
};

type StressTest = {
  id: number;
  created_at: string;
  spot_shift?: number;
  vol_shift?: number;
  time_shift?: number;
};

const baseUrl =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";

export default function StrategyDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const [strategy, setStrategy] = useState<Strategy | null>(null);
  const [name, setName] = useState("");
  const [strategyKind, setStrategyKind] = useState("momentum");
  const [legs, setLegs] = useState<StrategyLeg[]>([]);
  const [newLegName, setNewLegName] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{
    name?: string;
    legs?: string;
  }>({});
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [pricingResult, setPricingResult] = useState<string | null>(null);
  const [riskResult, setRiskResult] = useState<string | null>(null);
  const [scenarioName, setScenarioName] = useState("Baseline");
  const [pricingLoading, setPricingLoading] = useState(false);
  const [riskLoading, setRiskLoading] = useState(false);
  const [pricingRuns, setPricingRuns] = useState<PricingRun[]>([]);
  const [stressTests, setStressTests] = useState<StressTest[]>([]);
  const [toast, setToast] = useState<string | null>(null);
  const [spotShift, setSpotShift] = useState(0);
  const [volShift, setVolShift] = useState(0);
  const [timeShift, setTimeShift] = useState(0);

  // Fetch the strategy detail by ID.
  const loadStrategy = async () => {
    setLoading(true);
    setError(null);
    setFieldErrors({});
    try {
      const res = await fetch(`${baseUrl}/api/strategies/${params.id}/`, {
        cache: "no-store",
      });
      if (!res.ok) {
        throw new Error("Failed to load strategy.");
      }
      const data = (await res.json()) as Strategy;
      setStrategy(data);
      setName(data.name);
      setStrategyKind(data.strategy_kind);
      setLegs(data.legs ?? []);
      setIsDirty(false);
    } catch (err) {
      setError("Could not load strategy. Try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStrategy();
  }, [params.id]);

  // Fetch recent pricing/risk activity for the strategy.
  const loadActivity = async () => {
    if (!params.id) {
      return;
    }
    try {
      const [pricingRes, stressRes] = await Promise.all([
        fetch(`${baseUrl}/api/pricing-runs/?strategy=${params.id}&ordering=-created_at`),
        fetch(`${baseUrl}/api/stress-tests/?strategy=${params.id}&ordering=-created_at`),
      ]);
      const pricingData = (await pricingRes.json()) as
        | PricingRun[]
        | { results?: PricingRun[] };
      const stressData = (await stressRes.json()) as
        | StressTest[]
        | { results?: StressTest[] };
      setPricingRuns(Array.isArray(pricingData) ? pricingData : pricingData.results ?? []);
      setStressTests(Array.isArray(stressData) ? stressData : stressData.results ?? []);
    } catch (err) {
      setPricingRuns([]);
      setStressTests([]);
    }
  };

  useEffect(() => {
    loadActivity();
  }, [params.id]);

  // Auto-clear the success toast.
  useEffect(() => {
    if (!toast) {
      return;
    }
    const timer = window.setTimeout(() => setToast(null), 2000);
    return () => window.clearTimeout(timer);
  }, [toast]);

  // Warn before unload if there are unsaved edits.
  useEffect(() => {
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (!isDirty) {
        return;
      }
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [isDirty]);

  // Add a new leg locally before saving.
  const addLeg = () => {
    const trimmed = newLegName.trim();
    if (!trimmed) {
      setFieldErrors((prev) => ({ ...prev, legs: "Leg name is required." }));
      return;
    }
    const tempLeg: StrategyLeg = { id: Date.now(), name: trimmed };
    setLegs((prev) => [...prev, tempLeg]);
    setNewLegName("");
    setIsDirty(true);
    setFieldErrors((prev) => ({ ...prev, legs: undefined }));
  };

  // Remove a leg locally before saving.
  const removeLeg = (id: number) => {
    setLegs((prev) => prev.filter((leg) => leg.id !== id));
    setIsDirty(true);
  };

  // Edit a leg name locally before saving.
  const updateLegName = (id: number, value: string) => {
    setLegs((prev) =>
      prev.map((leg) => (leg.id === id ? { ...leg, name: value } : leg))
    );
    setIsDirty(true);
  };

  // Persist edits to the API.
  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    setError(null);
    setFieldErrors({});
    try {
      const token = window.localStorage.getItem("auth_token");
      const payload = {
        name: name.trim(),
        strategy_kind: strategyKind,
        legs: legs.map((leg) => ({ name: leg.name.trim() })),
      };
      const res = await fetch(`${baseUrl}/api/strategies/${params.id}/`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Token ${token}` } : {}),
        },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const detail = await res.json();
        setFieldErrors({
          name: detail?.name?.[0],
          legs: detail?.legs?.[0],
        });
        const message =
          detail?.errors?.detail ||
          detail?.detail ||
          detail?.legs?.[0] ||
          detail?.name?.[0] ||
          "Update failed.";
        throw new Error(message);
      }
      await loadStrategy();
      await loadActivity();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save strategy.");
    } finally {
      setSaving(false);
    }
  };

  // Run pricing preview stub.
  const runPricingPreview = async () => {
    if (!strategy) {
      return;
    }
    setPricingLoading(true);
    setPricingResult(null);
    try {
      const token = window.localStorage.getItem("auth_token");
      const res = await fetch(`${baseUrl}/api/pricing/preview/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Token ${token}` } : {}),
        },
        body: JSON.stringify({ strategy_id: strategy.id }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.errors?.strategy_id || "Preview failed.");
      }
      setPricingResult(data.message || "Pricing preview complete.");
      setToast("Pricing preview completed.");
      await loadActivity();
    } catch (err) {
      setPricingResult(
        err instanceof Error ? err.message : "Pricing preview failed."
      );
    } finally {
      setPricingLoading(false);
    }
  };

  // Run risk scenario stub.
  const runRiskScenario = async () => {
    if (!strategy) {
      return;
    }
    setRiskLoading(true);
    setRiskResult(null);
    try {
      const token = window.localStorage.getItem("auth_token");
      const res = await fetch(`${baseUrl}/api/risk/scenario/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Token ${token}` } : {}),
        },
        body: JSON.stringify({
          strategy_id: strategy.id,
          scenario_name: scenarioName.trim() || "Baseline",
          spot_shift: spotShift,
          vol_shift: volShift,
          time_shift: timeShift,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.errors?.strategy_id || "Scenario failed.");
      }
      setRiskResult(data.message || "Risk scenario complete.");
      setToast("Risk scenario completed.");
      await loadActivity();
    } catch (err) {
      setRiskResult(err instanceof Error ? err.message : "Risk scenario failed.");
    } finally {
      setRiskLoading(false);
    }
  };

  // Delete the entire strategy.
  const deleteStrategy = async () => {
    setSaving(true);
    setError(null);
    try {
      const token = window.localStorage.getItem("auth_token");
      const res = await fetch(`${baseUrl}/api/strategies/${params.id}/`, {
        method: "DELETE",
        headers: token ? { Authorization: `Token ${token}` } : {},
      });
      if (!res.ok) {
        const detail = await res.json();
        const message =
          detail?.errors?.detail || detail?.detail || "Delete failed.";
        throw new Error(message);
      }
      window.location.href = "/strategies";
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not delete strategy.");
    } finally {
      setSaving(false);
    }
  };

  // Compute simple activity info.
  const activityLabel = useMemo(() => {
    if (!strategy?.created_at) {
      return "No activity yet";
    }
    const created = new Date(strategy.created_at);
    return `Created ${created.toLocaleDateString()}`;
  }, [strategy]);

  if (loading) {
    return (
      <section className="space-y-6">
        <p className="text-sm text-ink">Loading strategy...</p>
      </section>
    );
  }

  if (!strategy) {
    return (
      <section className="space-y-6">
        <p className="text-sm text-ink">Strategy not found.</p>
      </section>
    );
  }

  return (
    <section className="space-y-6">
      {toast && (
        <div className="rounded-lg border border-accent bg-paper px-3 py-2 text-xs text-accent">
          {toast}
        </div>
      )}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-ink">Strategy detail</p>
          <h2 className="text-3xl font-semibold">{strategy.name}</h2>
        </div>
        <a className="text-sm underline decoration-accent" href="/strategies">
          Back to strategies
        </a>
      </div>

      {error && (
        <div className="rounded-lg border border-accent bg-paper px-4 py-3 text-sm text-accent">
          {error}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[2fr,1fr]">
        <form
          className="space-y-6 rounded-xl border border-ink bg-paper p-6"
          onSubmit={handleSubmit}
        >
          <div className="grid gap-4 md:grid-cols-3">
            <div className="md:col-span-2">
              <label className="text-sm text-ink">Name</label>
              <input
                className="mt-2 w-full rounded-lg border border-ink bg-paper px-3 py-2 text-sm"
                value={name}
                onChange={(event: ChangeEvent<HTMLInputElement>) => {
                  setName(event.target.value);
                  setIsDirty(true);
                }}
                required
              />
              <div className="mt-2 flex items-center justify-between text-xs text-ink">
                <span>{name.trim().length} characters</span>
                {fieldErrors.name && (
                  <span className="text-accent">{fieldErrors.name}</span>
                )}
              </div>
            </div>
            <div>
              <label className="text-sm text-ink">Type</label>
              <select
                className="mt-2 w-full rounded-lg border border-ink bg-paper px-3 py-2 text-sm"
                value={strategyKind}
                onChange={(event: ChangeEvent<HTMLSelectElement>) => {
                  setStrategyKind(event.target.value);
                  setIsDirty(true);
                }}
              >
                <option value="momentum">Momentum</option>
                <option value="ml">ML</option>
                <option value="arbitrage">Arbitrage</option>
              </select>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Legs</h3>
              <span className="text-sm text-ink">Total: {legs.length}</span>
            </div>
            <div className="space-y-2">
              {legs.map((leg) => (
                <div
                  key={leg.id}
                  className="flex flex-col gap-2 rounded-lg border border-ink px-3 py-2 md:flex-row md:items-center md:justify-between"
                >
                  <input
                    className="w-full rounded-md border border-ink bg-paper px-2 py-1 text-sm md:max-w-xs"
                    value={leg.name}
                    onChange={(event: ChangeEvent<HTMLInputElement>) =>
                      updateLegName(leg.id, event.target.value)
                    }
                  />
                  <button
                    className="text-sm text-accent"
                    type="button"
                    onClick={() => removeLeg(leg.id)}
                  >
                    Remove
                  </button>
                </div>
              ))}
              {legs.length === 0 && (
                <p className="text-sm text-ink">Add at least one leg to save.</p>
              )}
            </div>
            <div className="flex flex-col gap-3 md:flex-row">
              <input
                className="flex-1 rounded-lg border border-ink bg-paper px-3 py-2 text-sm"
                placeholder="New leg name"
                value={newLegName}
                onChange={(event: ChangeEvent<HTMLInputElement>) =>
                  setNewLegName(event.target.value)
                }
              />
              <button
                className="rounded-lg border border-ink px-4 py-2 text-sm text-ink"
                type="button"
                onClick={addLeg}
              >
                Add leg
              </button>
            </div>
            {fieldErrors.legs && (
              <p className="text-sm text-accent">{fieldErrors.legs}</p>
            )}
          </div>

          {/* Scenario controls (stub). */}
          <div className="space-y-4 border-t border-ink pt-6">
            <div>
              <h3 className="text-lg font-semibold">Scenario controls</h3>
              <p className="mt-1 text-sm text-ink">
                Adjust spot, volatility, and time to preview scenario inputs.
              </p>
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              <label className="text-sm text-ink">
                Spot shift ({spotShift}%)
                <input
                  className="mt-2 w-full"
                  type="range"
                  min={-50}
                  max={50}
                  value={spotShift}
                  onChange={(event) => setSpotShift(Number(event.target.value))}
                />
              </label>
              <label className="text-sm text-ink">
                Vol shift ({volShift}%)
                <input
                  className="mt-2 w-full"
                  type="range"
                  min={-50}
                  max={50}
                  value={volShift}
                  onChange={(event) => setVolShift(Number(event.target.value))}
                />
              </label>
              <label className="text-sm text-ink">
                Time shift (days: {timeShift})
                <input
                  className="mt-2 w-full"
                  type="range"
                  min={0}
                  max={365}
                  value={timeShift}
                  onChange={(event) => setTimeShift(Number(event.target.value))}
                />
              </label>
            </div>
            <div className="rounded-lg border border-ink px-4 py-3 text-sm text-ink">
              Scenario input: spot {spotShift}%, vol {volShift}%, time {timeShift}d
            </div>
          </div>

          <div className="flex flex-col gap-3 md:flex-row md:items-center">
            <button
              className="rounded-lg bg-ink px-4 py-2 text-sm font-semibold text-paper disabled:cursor-not-allowed disabled:opacity-60"
              type="submit"
              disabled={saving}
            >
              {saving ? "Saving..." : "Save changes"}
            </button>
            <button
              className="rounded-lg border border-accent px-4 py-2 text-sm text-accent disabled:cursor-not-allowed disabled:opacity-60"
              type="button"
              onClick={() => setShowDeleteConfirm(true)}
              disabled={saving}
            >
              Delete strategy
            </button>
            {isDirty && (
              <span className="text-xs text-accent">
                Unsaved changes
              </span>
            )}
          </div>
        </form>

        <aside className="space-y-4 rounded-xl border border-ink bg-paper p-6">
          {/* Pricing stub controls. */}
          <div className="space-y-3">
            <h3 className="text-lg font-semibold">Pricing preview</h3>
            <p className="text-sm text-ink">
              Run a placeholder pricing preview for this strategy.
            </p>
            <button
              className="rounded-lg border border-ink px-4 py-2 text-sm text-ink disabled:opacity-60"
              type="button"
              onClick={runPricingPreview}
              disabled={pricingLoading}
            >
              {pricingLoading ? "Running..." : "Run preview"}
            </button>
            {pricingResult && (
              <p className="text-xs text-ink">{pricingResult}</p>
            )}
          </div>
          {/* Risk stub controls. */}
          <div className="space-y-3 border-t border-ink pt-4">
            <h3 className="text-lg font-semibold">Risk scenario</h3>
            <p className="text-sm text-ink">
              Trigger a placeholder risk scenario run.
            </p>
            <input
              className="w-full rounded-lg border border-ink bg-paper px-3 py-2 text-sm"
              value={scenarioName}
              onChange={(event: ChangeEvent<HTMLInputElement>) =>
                setScenarioName(event.target.value)
              }
            />
            <button
              className="rounded-lg border border-ink px-4 py-2 text-sm text-ink disabled:opacity-60"
              type="button"
              onClick={runRiskScenario}
              disabled={riskLoading}
            >
              {riskLoading ? "Running..." : "Run scenario"}
            </button>
            {riskResult && <p className="text-xs text-ink">{riskResult}</p>}
          </div>
          {/* Visualization stub. */}
          <div className="space-y-3 border-t border-ink pt-4">
            <h3 className="text-lg font-semibold">Visualization</h3>
            <p className="text-sm text-ink">
              Chart placeholder for payoff and scenario curves.
            </p>
            <div className="rounded-lg border border-ink p-2">
              <PlotlyStub
                title="Scenario Preview"
                seriesLabel="Spot"
                x={[0, 1, 2, 3, 4]}
                y={[
                  spotShift,
                  spotShift + volShift * 0.2,
                  spotShift + volShift * 0.4,
                  spotShift + volShift * 0.6,
                  spotShift + volShift * 0.8,
                ]}
              />
            </div>
          </div>
          {/* Recent activity snapshots. */}
          <div className="space-y-3 border-t border-ink pt-4">
            <h3 className="text-lg font-semibold">Recent runs</h3>
            <div className="space-y-2 text-sm text-ink">
              <div>
                <p className="text-xs uppercase">Pricing</p>
                {pricingRuns.length === 0 ? (
                  <p className="text-sm text-ink">No pricing runs yet.</p>
                ) : (
                  <ul className="mt-1 space-y-1">
                    {pricingRuns.slice(0, 5).map((run) => (
                      <li key={run.id}>
                        Run #{run.id} - {new Date(run.created_at).toLocaleDateString()}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              <div>
                <p className="text-xs uppercase">Risk</p>
                {stressTests.length === 0 ? (
                  <p className="text-sm text-ink">No stress tests yet.</p>
                ) : (
                  <ul className="mt-1 space-y-1">
                    {stressTests.slice(0, 5).map((run) => (
                      <li key={run.id}>
                        Test #{run.id} - {new Date(run.created_at).toLocaleDateString()} -
                        {` spot ${run.spot_shift ?? 0}% / vol ${run.vol_shift ?? 0}% / time ${
                          run.time_shift ?? 0
                        }d`}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>
          <div>
            <h3 className="text-lg font-semibold">Activity</h3>
            <p className="mt-1 text-sm text-ink">{activityLabel}</p>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-ink">Next runs</h4>
            <ul className="mt-2 space-y-2 text-sm text-ink">
              <li>Pricing preview (placeholder)</li>
              <li>Risk scenario sweep (placeholder)</li>
              <li>Monte Carlo batch (placeholder)</li>
            </ul>
          </div>
        </aside>
      </div>

      {showDeleteConfirm && (
        <div className="fixed inset-0 z-10 flex items-center justify-center bg-paper/80 p-6">
          <div className="w-full max-w-md rounded-xl border border-ink bg-paper p-6">
            <h3 className="text-lg font-semibold">Delete strategy?</h3>
            <p className="mt-2 text-sm text-ink">
              This will remove the strategy and its legs. This action cannot be undone.
            </p>
            <div className="mt-4 flex flex-col gap-3 md:flex-row md:justify-end">
              <button
                className="rounded-lg border border-ink px-4 py-2 text-sm text-ink"
                type="button"
                onClick={() => setShowDeleteConfirm(false)}
                disabled={saving}
              >
                Cancel
              </button>
              <button
                className="rounded-lg border border-accent px-4 py-2 text-sm text-accent"
                type="button"
                onClick={deleteStrategy}
                disabled={saving}
              >
                Confirm delete
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
