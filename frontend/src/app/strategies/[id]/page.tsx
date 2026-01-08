"use client";

import type { ChangeEvent, FormEvent } from "react";
import { useEffect, useMemo, useState } from "react";

import PayoffChart from "@/components/PayoffChart";
import PricingPanel from "@/components/PricingPanel";
import PricingResultsTable from "@/components/PricingResultsTable";
import RiskRunPanel from "@/components/RiskRunPanel";
import ScenarioControls from "@/components/ScenarioControls";
import { apiFetch } from "@/lib/api";
import type { PayoffGridResponse, PricingPreviewResponse } from "@/types/pricing";

type StrategyLeg = {
  id: number;
  right: "call" | "put";
  strike: string | null;
  expiry: string | null;
  quantity: number;
};

type Strategy = {
  id: number;
  name: string;
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

export default function StrategyDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const [strategy, setStrategy] = useState<Strategy | null>(null);
  const [name, setName] = useState("");
  const [legs, setLegs] = useState<StrategyLeg[]>([]);
  const [newLeg, setNewLeg] = useState({
    right: "call" as "call" | "put",
    strike: "",
    expiry: "",
    quantity: 1,
  });
  const [legSavingId, setLegSavingId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{
    name?: string;
    legs?: string;
  }>({});
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [pricingPreview, setPricingPreview] = useState<PricingPreviewResponse | null>(null);
  const [pricingAssumptions, setPricingAssumptions] = useState({
    spot: 100,
    r: 0.02,
    q: 0,
    asOf: new Date().toISOString().slice(0, 10),
    globalIv: 0.25,
  });
  const [payoffResult, setPayoffResult] = useState<PayoffGridResponse | null>(null);
  const [payoffLoading, setPayoffLoading] = useState(false);
  const [payoffError, setPayoffError] = useState<string | null>(null);
  const [riskResult, setRiskResult] = useState<string | null>(null);
  const [scenarioName, setScenarioName] = useState("Baseline");
  const [riskLoading, setRiskLoading] = useState(false);
  const [pricingRuns, setPricingRuns] = useState<PricingRun[]>([]);
  const [stressTests, setStressTests] = useState<StressTest[]>([]);
  const [toast, setToast] = useState<string | null>(null);
  const [spotShift, setSpotShift] = useState(0);
  const [volShift, setVolShift] = useState(0);
  const [timeShift, setTimeShift] = useState(0);

  // Hydrate assumptions from query params for shareable permalinks.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const spot = Number(params.get("spot"));
    const iv = Number(params.get("iv"));
    const rate = Number(params.get("r"));
    const dividend = Number(params.get("q"));
    const asOf = params.get("as_of");
    const spotShiftParam = Number(params.get("spot_shift"));
    const volShiftParam = Number(params.get("vol_shift"));
    const timeShiftParam = Number(params.get("time_shift"));

    setPricingAssumptions((prev) => ({
      spot: Number.isFinite(spot) ? spot : prev.spot,
      r: Number.isFinite(rate) ? rate : prev.r,
      q: Number.isFinite(dividend) ? dividend : prev.q,
      asOf: asOf || prev.asOf,
      globalIv: Number.isFinite(iv) ? iv : prev.globalIv,
    }));
    if (Number.isFinite(spotShiftParam)) {
      setSpotShift(spotShiftParam);
    }
    if (Number.isFinite(volShiftParam)) {
      setVolShift(volShiftParam);
    }
    if (Number.isFinite(timeShiftParam)) {
      setTimeShift(timeShiftParam);
    }
  }, []);

  // Fetch the strategy detail by ID.
  const loadStrategy = async () => {
    setLoading(true);
    setError(null);
    setFieldErrors({});
    try {
      const data = (await apiFetch<Strategy>(
        `/api/strategies/${params.id}/`
      )) as Strategy;
      setStrategy(data);
      setName(data.name);
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

  // Fetch legs for the strategy.
  const loadLegs = async () => {
    if (!params.id) {
      return;
    }
    try {
      const data = await apiFetch<StrategyLeg[]>(
        `/api/strategies/${params.id}/legs/`
      );
      setLegs(data);
    } catch (err) {
      setLegs([]);
    }
  };

  useEffect(() => {
    loadLegs();
  }, [params.id]);

  // Fetch payoff curve data for the current strategy.
  useEffect(() => {
    if (!strategy || legs.length === 0) {
      setPayoffResult(null);
      return;
    }
    setPayoffLoading(true);
    setPayoffError(null);
    const timer = window.setTimeout(() => {
      apiFetch<PayoffGridResponse>("/api/pricing/payoff-grid/", {
        method: "POST",
        body: JSON.stringify({
          strategy_id: strategy.id,
          spot: pricingAssumptions.spot,
          spot_min_mult: 0.5,
          spot_max_mult: 1.5,
          num_points: 200,
        }),
      })
        .then((data) => setPayoffResult(data))
        .catch((err) => {
          const message =
            (err as { detail?: string })?.detail || "Payoff grid failed.";
          setPayoffError(message);
          setPayoffResult(null);
        })
        .finally(() => setPayoffLoading(false));
    }, 400);

    return () => window.clearTimeout(timer);
  }, [strategy, legs, pricingAssumptions.spot]);

  // Fetch recent pricing/risk activity for the strategy.
  const loadActivity = async () => {
    if (!params.id) {
      return;
    }
    try {
      const [pricingData, stressData] = await Promise.all([
        apiFetch<PricingRun[] | { results?: PricingRun[] }>(
          `/api/pricing-runs/?strategy=${params.id}&ordering=-created_at`
        ),
        apiFetch<StressTest[] | { results?: StressTest[] }>(
          `/api/stress-tests/?strategy=${params.id}&ordering=-created_at`
        ),
      ]);
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

  // Persist assumptions into the URL for shareable links.
  useEffect(() => {
    const params = new URLSearchParams();
    params.set("spot", String(pricingAssumptions.spot));
    params.set("iv", String(pricingAssumptions.globalIv));
    params.set("r", String(pricingAssumptions.r));
    params.set("q", String(pricingAssumptions.q));
    params.set("as_of", pricingAssumptions.asOf);
    params.set("spot_shift", String(spotShift));
    params.set("vol_shift", String(volShift));
    params.set("time_shift", String(timeShift));
    const url = `${window.location.pathname}?${params.toString()}`;
    window.history.replaceState(null, "", url);
  }, [pricingAssumptions, spotShift, volShift, timeShift]);

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
    setFieldErrors((prev) => ({ ...prev, legs: undefined }));
    if (!newLeg.right) {
      setFieldErrors((prev) => ({ ...prev, legs: "Right is required." }));
      return;
    }
    if (newLeg.quantity === 0) {
      setFieldErrors((prev) => ({ ...prev, legs: "Quantity must be non-zero." }));
      return;
    }
    const payload = {
      right: newLeg.right,
      strike: newLeg.strike ? Number(newLeg.strike) : null,
      expiry: newLeg.expiry || null,
      quantity: Number(newLeg.quantity),
    };
    setLegSavingId(-1);
    apiFetch<StrategyLeg>(`/api/strategies/${params.id}/legs/`, {
      method: "POST",
      body: JSON.stringify(payload),
    })
      .then((created) => {
        setLegs((prev) => [created, ...prev]);
        setNewLeg({ right: "call", strike: "", expiry: "", quantity: 1 });
      })
      .catch((err) => {
        const message =
          (err as { detail?: string })?.detail || "Leg create failed.";
        setFieldErrors((prev) => ({ ...prev, legs: message }));
      })
      .finally(() => {
        setLegSavingId(null);
      });
  };

  // Remove a leg via API.
  const removeLeg = (id: number) => {
    setLegSavingId(id);
    apiFetch(`/api/strategies/${params.id}/legs/${id}/`, {
      method: "DELETE",
    })
      .then(() => {
        setLegs((prev) => prev.filter((leg) => leg.id !== id));
      })
      .catch((err) => {
        const message =
          (err as { detail?: string })?.detail || "Leg delete failed.";
        setFieldErrors((prev) => ({ ...prev, legs: message }));
      })
      .finally(() => {
        setLegSavingId(null);
      });
  };

  // Persist an edited leg via API.
  const saveLeg = (leg: StrategyLeg) => {
    setLegSavingId(leg.id);
    const payload = {
      right: leg.right,
      strike: leg.strike ? Number(leg.strike) : null,
      expiry: leg.expiry || null,
      quantity: Number(leg.quantity),
    };
    apiFetch<StrategyLeg>(`/api/strategies/${params.id}/legs/${leg.id}/`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    })
      .then((updated) => {
        setLegs((prev) => prev.map((item) => (item.id === updated.id ? updated : item)));
      })
      .catch((err) => {
        const message =
          (err as { detail?: string })?.detail || "Leg update failed.";
        setFieldErrors((prev) => ({ ...prev, legs: message }));
      })
      .finally(() => {
        setLegSavingId(null);
      });
  };

  // Persist edits to the API.
  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    setError(null);
    setFieldErrors({});
    try {
      const payload = {
        name: name.trim(),
      };
      try {
        await apiFetch(`/api/strategies/${params.id}/`, {
          method: "PATCH",
          body: JSON.stringify(payload),
        });
      } catch (detail) {
        const errorObj = detail as { name?: string[]; legs?: string[]; detail?: string };
        setFieldErrors({
          name: errorObj?.name?.[0],
          legs: errorObj?.legs?.[0],
        });
        const message =
          errorObj?.detail ||
          errorObj?.legs?.[0] ||
          errorObj?.name?.[0] ||
          "Update failed.";
        throw new Error(message);
      }
      await loadStrategy();
      await loadLegs();
      await loadActivity();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save strategy.");
    } finally {
      setSaving(false);
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
      const data = await apiFetch<{ message?: string; errors?: { strategy_id?: string } }>(
        "/api/risk/scenario/",
        {
          method: "POST",
          body: JSON.stringify({
            strategy_id: strategy.id,
            scenario_name: scenarioName.trim() || "Baseline",
            spot_shift: spotShift,
            vol_shift: volShift,
            time_shift: timeShift,
          }),
        }
      );
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
      try {
        await apiFetch(`/api/strategies/${params.id}/`, { method: "DELETE" });
      } catch (detail) {
        const errorObj = detail as { detail?: string };
        const message = errorObj?.detail || "Delete failed.";
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
        <div className="space-y-6">
          <form
            className="space-y-6 rounded-xl border border-ink bg-paper p-6"
            onSubmit={handleSubmit}
          >
          <div className="grid gap-4 md:grid-cols-2">
            <div>
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
                  className="grid gap-2 rounded-lg border border-ink px-3 py-2 md:grid-cols-5"
                >
                  <select
                    className="rounded-md border border-ink bg-paper px-2 py-1 text-sm"
                    value={leg.right}
                    onChange={(event: ChangeEvent<HTMLSelectElement>) =>
                      setLegs((prev) =>
                        prev.map((item) =>
                          item.id === leg.id
                            ? { ...item, right: event.target.value as "call" | "put" }
                            : item
                        )
                      )
                    }
                  >
                    <option value="call">Call</option>
                    <option value="put">Put</option>
                  </select>
                  <input
                    className="rounded-md border border-ink bg-paper px-2 py-1 text-sm"
                    value={leg.strike ?? ""}
                    onChange={(event: ChangeEvent<HTMLInputElement>) =>
                      setLegs((prev) =>
                        prev.map((item) =>
                          item.id === leg.id ? { ...item, strike: event.target.value } : item
                        )
                      )
                    }
                    placeholder="Strike"
                    type="number"
                    step="0.01"
                  />
                  <input
                    className="rounded-md border border-ink bg-paper px-2 py-1 text-sm"
                    value={leg.expiry ?? ""}
                    onChange={(event: ChangeEvent<HTMLInputElement>) =>
                      setLegs((prev) =>
                        prev.map((item) =>
                          item.id === leg.id ? { ...item, expiry: event.target.value } : item
                        )
                      )
                    }
                    type="date"
                  />
                  <input
                    className="rounded-md border border-ink bg-paper px-2 py-1 text-sm"
                    value={leg.quantity}
                    onChange={(event: ChangeEvent<HTMLInputElement>) =>
                      setLegs((prev) =>
                        prev.map((item) =>
                          item.id === leg.id
                            ? { ...item, quantity: Number(event.target.value) }
                            : item
                        )
                      )
                    }
                    placeholder="Qty"
                    type="number"
                  />
                  <div className="flex items-center justify-between gap-2 text-sm">
                    <button
                      className="text-ink"
                      type="button"
                      disabled={legSavingId === leg.id}
                      onClick={() => saveLeg(leg)}
                    >
                      {legSavingId === leg.id ? "Saving" : "Save"}
                    </button>
                    <button
                      className="text-accent"
                      type="button"
                      disabled={legSavingId === leg.id}
                      onClick={() => removeLeg(leg.id)}
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))}
              {legs.length === 0 && (
                <p className="text-sm text-ink">Add at least one leg to save.</p>
              )}
            </div>
            <div className="flex flex-col gap-3 md:flex-row">
              <input
                className="flex-1 rounded-lg border border-ink bg-paper px-3 py-2 text-sm"
                placeholder="Strike"
                value={newLeg.strike}
                onChange={(event: ChangeEvent<HTMLInputElement>) =>
                  setNewLeg((prev) => ({ ...prev, strike: event.target.value }))
                }
                type="number"
                step="0.01"
              />
              <input
                className="flex-1 rounded-lg border border-ink bg-paper px-3 py-2 text-sm"
                placeholder="Expiry"
                value={newLeg.expiry}
                onChange={(event: ChangeEvent<HTMLInputElement>) =>
                  setNewLeg((prev) => ({ ...prev, expiry: event.target.value }))
                }
                type="date"
              />
              <input
                className="flex-1 rounded-lg border border-ink bg-paper px-3 py-2 text-sm"
                placeholder="Qty"
                value={newLeg.quantity}
                onChange={(event: ChangeEvent<HTMLInputElement>) =>
                  setNewLeg((prev) => ({ ...prev, quantity: Number(event.target.value) }))
                }
                type="number"
              />
              <select
                className="rounded-lg border border-ink bg-paper px-3 py-2 text-sm"
                value={newLeg.right}
                onChange={(event: ChangeEvent<HTMLSelectElement>) =>
                  setNewLeg((prev) => ({
                    ...prev,
                    right: event.target.value as "call" | "put",
                  }))
                }
              >
                <option value="call">Call</option>
                <option value="put">Put</option>
              </select>
              <button
                className="rounded-lg border border-ink px-4 py-2 text-sm text-ink"
                type="button"
                onClick={addLeg}
              >
                {legSavingId === -1 ? "Adding" : "Add leg"}
              </button>
            </div>
            {fieldErrors.legs && (
              <p className="text-sm text-accent">{fieldErrors.legs}</p>
            )}
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

          <div className="space-y-6">
            <PricingPanel
              strategyId={strategy.id}
              legs={legs}
              spotShift={spotShift}
              volShift={volShift}
              timeShiftDays={timeShift}
              assumptions={pricingAssumptions}
              onAssumptionsChange={setPricingAssumptions}
              onResult={setPricingPreview}
            />
            <PricingResultsTable result={pricingPreview} />
            <ScenarioControls
              spotShift={spotShift}
              volShift={volShift}
              timeShiftDays={timeShift}
              onSpotShiftChange={setSpotShift}
              onVolShiftChange={setVolShift}
              onTimeShiftChange={setTimeShift}
            />
            <div className="space-y-3 rounded-xl border border-ink bg-paper p-6">
              <div>
                <h3 className="text-lg font-semibold">Payoff at expiry</h3>
                <p className="mt-1 text-sm text-ink">
                  Payoff curve ignores scenario shifts and assumes expiry valuation.
                </p>
              </div>
              {payoffLoading && <p className="text-xs text-ink">Loading payoff grid...</p>}
              {payoffError && <p className="text-xs text-accent">{payoffError}</p>}
              <PayoffChart
                grid={payoffResult?.grid ?? []}
                pnl={payoffResult?.pnl ?? []}
                breakevens={payoffResult?.breakevens ?? []}
                spot={pricingAssumptions.spot}
              />
            </div>
            <RiskRunPanel
              strategyId={strategy.id}
              defaultSpot={pricingAssumptions.spot}
              defaultRate={pricingAssumptions.r}
              defaultDividend={pricingAssumptions.q}
              defaultSigma={pricingAssumptions.globalIv}
              defaultAsOf={pricingAssumptions.asOf}
            />
          </div>
        </div>

        <aside className="space-y-4 rounded-xl border border-ink bg-paper p-6">
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
