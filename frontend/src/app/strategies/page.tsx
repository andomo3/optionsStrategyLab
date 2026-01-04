export default function StrategiesPage() {
  return (
    <section className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-semibold">Strategies</h2>
          <p className="text-sm text-ink-700">Manage and compare multi-leg structures.</p>
        </div>
        <button className="rounded-full bg-ink-900 px-5 py-2 text-sm font-semibold text-sand-50">
          Create strategy
        </button>
      </div>
      <div className="overflow-hidden rounded-xl border border-sand-200 bg-white/60">
        <table className="w-full text-left text-sm">
          <thead className="bg-sand-100 text-ink-700">
            <tr>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Legs</th>
              <th className="px-4 py-3">Last updated</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-t border-sand-200">
              <td className="px-4 py-3">Iron Condor (stub)</td>
              <td className="px-4 py-3">4</td>
              <td className="px-4 py-3">-</td>
            </tr>
            <tr className="border-t border-sand-200">
              <td className="px-4 py-3">Calendar Spread (stub)</td>
              <td className="px-4 py-3">2</td>
              <td className="px-4 py-3">-</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  );
}
