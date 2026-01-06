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

type FilterState = {
  search: string;
  strategy_kind: string;
  page: number;
};

const initialFormState: FormState = {
  name: "",
  strategy_kind: "momentum",
  leg_name: "",
};

const initialFilterState: FilterState = {
  search: "",
  strategy_kind: "all",
  page: 1,
};

const baseUrl =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";

export default function StrategiesPage() {
  const [strategies, setStrategies] = useState<Strategy[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [hasNext, setHasNext] = useState(false);
  const [hasPrevious, setHasPrevious] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(initialFormState);
  const [filters, setFilters] = useState<FilterState>(initialFilterState);
  const [submitting, setSubmitting] = useState(false);

  const fetchStrategies = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      params.set("ordering", "-created_at");
      params.set("page", String(filters.page));
      if (filters.search.trim()) {
        params.set("search", filters.search.trim());
      }
      if (filters.strategy_kind !== "all") {
        params.set("strategy_kind", filters.strategy_kind);
      }
      const res = await fetch(
        `${baseUrl}/api/strategies/?${params.toString()}`,
        { cache: "no-store" }
      );
      if (!res.ok) {
        throw new Error("Failed to load strategies.");
      }
      const data = (await res.json()) as
        | Strategy[]
        | {
            results?: Strategy[];
            count?: number;
            next?: string | null;
            previous?: string | null;
          };
      const items = Array.isArray(data) ? data : data.results ?? [];
      const count = Array.isArray(data) ? items.length : data.count ?? items.length;
      const next = Array.isArray(data) ? null : data.next ?? null;
      const previous = Array.isArray(data) ? null : data.previous ?? null;
      setStrategies(items);
      setTotalCount(count);
      setHasNext(Boolean(next));
      setHasPrevious(Boolean(previous));
    } catch (err) {
      setError("Could not load strategies. Try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStrategies();
  }, [filters.page, filters.search, filters.strategy_kind]);

  const handleChange = (event: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleFilterChange = (
    event: ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = event.target;
    setFilters((prev) => ({
      ...prev,
      [name]: value,
      page: 1,
    }));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const token = window.localStorage.getItem("auth_token");
      const payload = {
        name: form.name.trim(),
        strategy_kind: form.strategy_kind,
        legs: [{ name: form.leg_name.trim() }],
      };
      const res = await fetch(`${baseUrl}/api/strategies/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Token ${token}` } : {}),
        },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const detail = await res.json();
        const message =
          detail?.errors?.detail ||
          detail?.detail ||
          detail?.legs?.[0] ||
          "Create failed.";
        throw new Error(message);
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
          Total: {totalCount}
        </span>
      </div>
      <div className="rounded-xl border border-ink bg-paper p-4">
        <div className="grid gap-3 md:grid-cols-3">
          <input
            className="rounded-lg border border-ink bg-paper px-3 py-2 text-sm"
            name="search"
            placeholder="Search strategies"
            value={filters.search}
            onChange={handleFilterChange}
          />
          <select
            className="rounded-lg border border-ink bg-paper px-3 py-2 text-sm"
            name="strategy_kind"
            value={filters.strategy_kind}
            onChange={handleFilterChange}
          >
            <option value="all">All types</option>
            <option value="momentum">Momentum</option>
            <option value="ml">ML</option>
            <option value="arbitrage">Arbitrage</option>
          </select>
          <div className="flex items-center gap-2 text-sm text-ink">
            <span>Page {filters.page}</span>
            <button
              className="rounded-lg border border-ink px-3 py-1 text-sm disabled:opacity-60"
              type="button"
              disabled={!hasPrevious}
              onClick={() =>
                setFilters((prev) => ({ ...prev, page: Math.max(prev.page - 1, 1) }))
              }
            >
              Prev
            </button>
            <button
              className="rounded-lg border border-ink px-3 py-1 text-sm disabled:opacity-60"
              type="button"
              disabled={!hasNext}
              onClick={() => setFilters((prev) => ({ ...prev, page: prev.page + 1 }))}
            >
              Next
            </button>
          </div>
        </div>
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
                  No strategies yet. Create the first one via the form above.
                </td>
              </tr>
            ) : (
              strategies.map((strategy) => (
                <tr key={strategy.id} className="border-t border-ink">
                  <td className="px-4 py-3">
                    <a className="underline decoration-accent" href={`/strategies/${strategy.id}`}>
                      {strategy.name}
                    </a>
                  </td>
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
