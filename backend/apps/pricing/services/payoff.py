from __future__ import annotations

from dataclasses import dataclass
from typing import Iterable, List


@dataclass(frozen=True)
class PayoffLeg:
    right: str
    strike: float
    quantity: float


def _leg_payoff(spot: float, leg: PayoffLeg) -> float:
    if leg.right == "call":
        intrinsic = max(spot - leg.strike, 0.0)
    else:
        intrinsic = max(leg.strike - spot, 0.0)
    return intrinsic * leg.quantity


def _find_breakevens(grid: List[float], pnl: List[float]) -> List[float]:
    breakevens: List[float] = []
    for idx in range(1, len(grid)):
        p1 = pnl[idx - 1]
        p2 = pnl[idx]
        s1 = grid[idx - 1]
        s2 = grid[idx]
        if p1 == 0.0:
            breakevens.append(s1)
            continue
        if p2 == 0.0:
            breakevens.append(s2)
            continue
        if (p1 < 0.0 and p2 > 0.0) or (p1 > 0.0 and p2 < 0.0):
            if p2 == p1:
                continue
            interpolated = s1 - p1 * (s2 - s1) / (p2 - p1)
            breakevens.append(interpolated)
    unique = sorted({round(value, 6) for value in breakevens})
    return unique


def build_payoff_grid(
    *,
    spot: float,
    spot_min_mult: float,
    spot_max_mult: float,
    num_points: int,
    legs: Iterable[PayoffLeg],
) -> dict:
    if spot <= 0:
        raise ValueError("spot must be positive")
    if spot_min_mult <= 0 or spot_max_mult <= 0:
        raise ValueError("spot multipliers must be positive")
    if spot_min_mult >= spot_max_mult:
        raise ValueError("spot_min_mult must be less than spot_max_mult")
    if num_points < 2:
        raise ValueError("num_points must be at least 2")

    min_spot = spot * spot_min_mult
    max_spot = spot * spot_max_mult
    step = (max_spot - min_spot) / (num_points - 1)

    grid: List[float] = []
    pnl: List[float] = []
    legs_list = list(legs)

    for idx in range(num_points):
        s = min_spot + step * idx
        grid.append(s)
        pnl.append(sum(_leg_payoff(s, leg) for leg in legs_list))

    breakevens = _find_breakevens(grid, pnl)
    slope_high = sum(leg.quantity for leg in legs_list if leg.right == "call")

    max_profit = None if slope_high > 0 else max(pnl) if pnl else 0.0
    max_loss = None if slope_high < 0 else min(pnl) if pnl else 0.0

    return {
        "grid": grid,
        "pnl": pnl,
        "breakevens": breakevens,
        "max_profit": max_profit,
        "max_loss": max_loss,
    }
