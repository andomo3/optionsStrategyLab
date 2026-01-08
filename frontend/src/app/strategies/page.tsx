"use client";

import type { ChangeEvent, FormEvent } from "react";
import { useEffect, useState } from "react";

import { apiFetch, setTokens } from "@/lib/api";

type StrategyLeg = {
  id: number;
  right: string;
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

type FormState = {
  name: string;
};

type FilterState = {
  search: string;
  page: number;
};

const initialFormState: FormState = {
  name: "",
};

const initialFilterState: FilterState = {
  search: "",
  page: 1,
};

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
  const [demoLoading, setDemoLoading] = useState(false);
  const [demoError, setDemoError] = useState<string | null>(null);

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
      const data = (await apiFetch<
        | Strategy[]
        | {
            results?: Strategy[];
            count?: number;
            next?: string | null;
            previous?: string | null;
          }
      >(`/api/strategies/?${params.toString()}`)) as
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
  }, [filters.page, filters.search]);

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
      const payload = {
        name: form.name.trim(),
      };
      await apiFetch("/api/strategies/", {
        method: "POST",
        body: JSON.stringify(payload),
      });
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

  const handleRecruiterMode = async () => {
    setDemoLoading(true);
    setDemoError(null);
    try {
      const data = await apiFetch<{ access: string; refresh: string; strategy_id?: number }>(
        "/api/auth/demo/login/",
        { method: "POST" }
      );
      setTokens(data.access, data.refresh);
      const params = new URLSearchParams({
        spot: "100",
        iv: "0.25",
        r: "0.02",
        q: "0",
        as_of: new Date().toISOString().slice(0, 10),
        spot_shift: "0",
        vol_shift: "0",
        time_shift: "0",
      });
      if (data.strategy_id) {
        window.location.href = `/strategies/${data.strategy_id}?${params.toString()}`;
        return;
      }
      window.location.href = "/strategies";
    } catch (err) {
      setDemoError("Demo login failed. Seed demo data first.");
    } finally {
      setDemoLoading(false);
    }
  };

  return (
    <section className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-semibold">Strategies</h2>
          <p className="text-sm text-ink">Manage and compare multi-leg structures.</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            className="rounded-full border border-ink px-4 py-2 text-sm text-ink disabled:opacity-60"
            type="button"
            onClick={handleRecruiterMode}
            disabled={demoLoading}
          >
            {demoLoading ? "Loading demo..." : "Recruiter Mode"}
          </button>
          <span className="rounded-full border border-ink px-4 py-2 text-sm text-ink">
            Total: {totalCount}
          </span>
        </div>
      </div>
      <div className="rounded-xl border border-ink bg-paper p-4">
        <div className="grid gap-3 md:grid-cols-2">
          <input
            className="rounded-lg border border-ink bg-paper px-3 py-2 text-sm"
            name="search"
            placeholder="Search strategies"
            value={filters.search}
            onChange={handleFilterChange}
          />
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
          <button
            className="rounded-lg bg-ink px-4 py-2 text-sm font-semibold text-paper disabled:cursor-not-allowed disabled:opacity-60 md:col-span-3"
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
      {demoError && (
        <div className="rounded-lg border border-accent bg-paper px-4 py-3 text-sm text-accent">
          {demoError}
        </div>
      )}
      <div className="overflow-hidden rounded-xl border border-ink bg-paper">
        <table className="w-full text-left text-sm">
          <thead className="bg-paper text-ink">
            <tr>
              <th className="px-4 py-3">Name</th>
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
