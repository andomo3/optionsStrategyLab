"use client";

import type { ChangeEvent, FormEvent } from "react";
import { useEffect, useState } from "react";

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

type FormState = {
  name: string;
  strategy_kind: string;
  leg_name: string;
};

const initialFormState: FormState = {
  name: "",
  strategy_kind: "momentum",
  leg_name: "",
};

const baseUrl =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";

export default function StrategiesPage() {
  const [strategies, setStrategies] = useState<Strategy[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(initialFormState);
  const [submitting, setSubmitting] = useState(false);

  const fetchStrategies = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `${baseUrl}/api/strategies/?ordering=-created_at`,
        { cache: "no-store" }
      );
      if (!res.ok) {
        throw new Error("Failed to load strategies.");
      }
      const data = (await res.json()) as Strategy[] | { results?: Strategy[] };
      const items = Array.isArray(data) ? data : data.results ?? [];
      setStrategies(items);
    } catch (err) {
      setError("Could not load strategies. Try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStrategies();
  }, []);

  const handleChange = (event: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const payload = {
        name: form.name.trim(),
        strategy_kind: form.strategy_kind,
        legs: [{ name: form.leg_name.trim() }],
      };
      const res = await fetch(`${baseUrl}/api/strategies/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const detail = await res.json();
        throw new Error(detail?.legs?.[0] || "Create failed.");
      }
      setForm(initialFormState);
      await fetchStrategies();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not create strategy."
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-semibold">Strategies</h2>
          <p className="text-sm text-ink">Manage and compare multi-leg structures.</p>
        </div>
        <span className="rounded-full border border-ink px-4 py-2 text-sm text-ink">
          Total: {strategies.length}
        </span>
      </div>
      <div className="rounded-xl border border-ink bg-paper p-6 shadow-sm">
        <h3 className="text-lg font-semibold">Create a strategy</h3>
        <p className="mt-1 text-sm text-ink">
          Add a name, type, and one initial leg. You can expand this later.
        </p>
        <form className="mt-4 grid gap-4 md:grid-cols-4" onSubmit={handleSubmit}>
          <input
            className="rounded-lg border border-ink bg-paper px-3 py-2 text-sm"
            name="name"
            placeholder="Strategy name"
            value={form.name}
            onChange={handleChange}
            required
          />
          <select
            className="rounded-lg border border-ink bg-paper px-3 py-2 text-sm"
            name="strategy_kind"
            value={form.strategy_kind}
            onChange={handleChange}
          >
            <option value="momentum">Momentum</option>
            <option value="ml">ML</option>
            <option value="arbitrage">Arbitrage</option>
          </select>
          <input
            className="rounded-lg border border-ink bg-paper px-3 py-2 text-sm"
            name="leg_name"
            placeholder="Initial leg name"
            value={form.leg_name}
            onChange={handleChange}
            required
          />
          <button
            className="rounded-lg bg-ink px-4 py-2 text-sm font-semibold text-paper disabled:cursor-not-allowed disabled:opacity-60"
            type="submit"
            disabled={submitting}
          >
            {submitting ? "Creating..." : "Create strategy"}
          </button>
        </form>
      </div>
      {error && (
        <div className="rounded-lg border border-accent bg-paper px-4 py-3 text-sm text-accent">
          {error}
        </div>
      )}
      <div className="overflow-hidden rounded-xl border border-ink bg-paper">
        <table className="w-full text-left text-sm">
          <thead className="bg-paper text-ink">
            <tr>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Type</th>
              <th className="px-4 py-3">Legs</th>
              <th className="px-4 py-3">Last updated</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr className="border-t border-ink">
                <td className="px-4 py-3 text-ink" colSpan={4}>
                  Loading strategies...
                </td>
              </tr>
            ) : strategies.length === 0 ? (
              <tr className="border-t border-ink">
                <td className="px-4 py-3 text-ink" colSpan={4}>
                  No strategies yet. Create the first one via the API.
                </td>
              </tr>
            ) : (
              strategies.map((strategy) => (
                <tr key={strategy.id} className="border-t border-ink">
                  <td className="px-4 py-3">{strategy.name}</td>
                  <td className="px-4 py-3 capitalize">{strategy.strategy_kind}</td>
                  <td className="px-4 py-3">{strategy.legs?.length ?? 0}</td>
                  <td className="px-4 py-3">
                    {new Date(strategy.created_at).toLocaleDateString()}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
