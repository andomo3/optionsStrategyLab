export const dynamic = "force-dynamic";

async function getHealth() {
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";
  try {
    const res = await fetch(`${baseUrl}/api/health/`, { cache: "no-store" });
    if (!res.ok) {
      return "unreachable";
    }
    const data = await res.json();
    return data.status || "unknown";
  } catch (error) {
    return "unreachable";
  }
}

export default async function HomePage() {
  const status = await getHealth();
  return (
    <section className="space-y-8">
      <div className="rounded-xl border border-ink bg-paper p-8 shadow-sm">
        <p className="text-sm font-mono text-ink">Strategy Lab</p>
        <h2 className="text-4xl font-semibold leading-tight text-ink">
          Multi-leg options design with scenario-first feedback.
        </h2>
        <p className="mt-4 text-ink">
          Assemble complex strategies, explore pricing and Greeks, and prepare for Monte Carlo
          risk views in a single workspace.
        </p>
        <div className="mt-6 inline-flex items-center gap-3 rounded-full border border-ink px-4 py-2 text-sm text-ink">
          <span className="h-2 w-2 rounded-full bg-accent" />
          API health: {status}
        </div>
      </div>
      <div className="grid gap-6 md:grid-cols-2">
        <div className="rounded-xl border border-ink bg-paper p-6">
          <h3 className="text-lg font-semibold">Scenario controls</h3>
          <p className="mt-2 text-sm text-ink">
            Sweep spot, volatility, and time to visualize how each leg responds.
          </p>
        </div>
        <div className="rounded-xl border border-ink bg-paper p-6">
          <h3 className="text-lg font-semibold">Risk narratives</h3>
          <p className="mt-2 text-sm text-ink">
            Capture why a strategy works with explainable, shareable outputs.
          </p>
        </div>
      </div>
    </section>
  );
}
