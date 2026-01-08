"use client";

import type { PricingPreviewResponse } from "@/types/pricing";

type PricingResultsTableProps = {
  result: PricingPreviewResponse | null;
};

export default function PricingResultsTable({ result }: PricingResultsTableProps) {
  if (!result) {
    return null;
  }

  return (
    <div className="overflow-hidden rounded-xl border border-ink bg-paper">
      <table className="w-full text-left text-xs">
        <thead className="bg-paper text-ink">
          <tr>
            <th className="px-3 py-2">Leg</th>
            <th className="px-3 py-2">Right</th>
            <th className="px-3 py-2">Strike</th>
            <th className="px-3 py-2">Expiry</th>
            <th className="px-3 py-2">Qty</th>
            <th className="px-3 py-2">IV</th>
            <th className="px-3 py-2">Price</th>
            <th className="px-3 py-2">Delta</th>
            <th className="px-3 py-2">Gamma</th>
            <th className="px-3 py-2">Vega</th>
            <th className="px-3 py-2">Theta</th>
          </tr>
        </thead>
        <tbody>
          {result.per_leg.map((leg) => (
            <tr key={leg.leg_id} className="border-t border-ink">
              <td className="px-3 py-2">#{leg.leg_id}</td>
              <td className="px-3 py-2">{leg.right}</td>
              <td className="px-3 py-2">{leg.strike.toFixed(2)}</td>
              <td className="px-3 py-2">{leg.expiry}</td>
              <td className="px-3 py-2">{leg.quantity}</td>
              <td className="px-3 py-2">{leg.iv.toFixed(3)}</td>
              <td className="px-3 py-2">{leg.price.toFixed(4)}</td>
              <td className="px-3 py-2">{leg.greeks.delta.toFixed(4)}</td>
              <td className="px-3 py-2">{leg.greeks.gamma.toFixed(4)}</td>
              <td className="px-3 py-2">{leg.greeks.vega.toFixed(4)}</td>
              <td className="px-3 py-2">{leg.greeks.theta.toFixed(4)}</td>
            </tr>
          ))}
        </tbody>
        <tfoot className="border-t border-ink text-ink">
          <tr>
            <td className="px-3 py-2 font-semibold" colSpan={6}>
              Totals
            </td>
            <td className="px-3 py-2 font-semibold">{result.totals.price.toFixed(4)}</td>
            <td className="px-3 py-2">{result.totals.greeks.delta.toFixed(4)}</td>
            <td className="px-3 py-2">{result.totals.greeks.gamma.toFixed(4)}</td>
            <td className="px-3 py-2">{result.totals.greeks.vega.toFixed(4)}</td>
            <td className="px-3 py-2">{result.totals.greeks.theta.toFixed(4)}</td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}
