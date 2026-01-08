"use client";

import type { ChangeEvent } from "react";

type ScenarioControlsProps = {
  spotShift: number;
  volShift: number;
  timeShiftDays: number;
  onSpotShiftChange: (value: number) => void;
  onVolShiftChange: (value: number) => void;
  onTimeShiftChange: (value: number) => void;
};

export default function ScenarioControls({
  spotShift,
  volShift,
  timeShiftDays,
  onSpotShiftChange,
  onVolShiftChange,
  onTimeShiftChange,
}: ScenarioControlsProps) {
  return (
    <div className="space-y-4 rounded-xl border border-ink bg-paper p-6">
      <div>
        <h3 className="text-lg font-semibold">Scenario controls</h3>
        <p className="mt-1 text-sm text-ink">
          Adjust spot, volatility, and time forward to stress the pricing preview.
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
            onChange={(event: ChangeEvent<HTMLInputElement>) =>
              onSpotShiftChange(Number(event.target.value))
            }
          />
        </label>
        <label className="text-sm text-ink">
          Vol shift ({volShift} pts)
          <input
            className="mt-2 w-full"
            type="range"
            min={-50}
            max={50}
            value={volShift}
            onChange={(event: ChangeEvent<HTMLInputElement>) =>
              onVolShiftChange(Number(event.target.value))
            }
          />
        </label>
        <label className="text-sm text-ink">
          Time forward (days: {timeShiftDays})
          <input
            className="mt-2 w-full"
            type="range"
            min={0}
            max={365}
            value={timeShiftDays}
            onChange={(event: ChangeEvent<HTMLInputElement>) =>
              onTimeShiftChange(Number(event.target.value))
            }
          />
        </label>
      </div>
      <div className="rounded-lg border border-ink px-3 py-2 text-xs text-ink">
        Scenario input: spot {spotShift}%, vol {volShift} pts, time {timeShiftDays}d
      </div>
    </div>
  );
}
