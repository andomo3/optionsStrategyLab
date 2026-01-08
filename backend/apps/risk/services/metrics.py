import math
from typing import List, Tuple


def _percentile(sorted_values: List[float], percentile: float) -> float:
    if not sorted_values:
        return 0.0
    if percentile <= 0:
        return sorted_values[0]
    if percentile >= 1:
        return sorted_values[-1]
    idx = percentile * (len(sorted_values) - 1)
    lower = math.floor(idx)
    upper = math.ceil(idx)
    if lower == upper:
        return sorted_values[int(idx)]
    weight = idx - lower
    return sorted_values[lower] * (1 - weight) + sorted_values[upper] * weight


def summarize_distribution(pnl: List[float], var_level: float = 0.05, bins: int = 20) -> dict:
    if not pnl:
        return {
            "expected_pl": 0.0,
            "pop": 0.0,
            "var": 0.0,
            "cvar": 0.0,
            "histogram": {"bins": [], "counts": []},
        }

    total = sum(pnl)
    expected_pl = total / len(pnl)
    pop = sum(1 for value in pnl if value > 0) / len(pnl)

    sorted_vals = sorted(pnl)
    var = _percentile(sorted_vals, var_level)
    tail = [value for value in pnl if value <= var]
    cvar = sum(tail) / len(tail) if tail else var

    min_val = min(pnl)
    max_val = max(pnl)
    if min_val == max_val:
        return {
            "expected_pl": expected_pl,
            "pop": pop,
            "var": var,
            "cvar": cvar,
            "histogram": {"bins": [min_val, max_val], "counts": [len(pnl)]},
        }

    step = (max_val - min_val) / bins
    edges = [min_val + step * i for i in range(bins + 1)]
    counts = [0 for _ in range(bins)]

    for value in pnl:
        index = min(int((value - min_val) / step), bins - 1)
        counts[index] += 1

    return {
        "expected_pl": expected_pl,
        "pop": pop,
        "var": var,
        "cvar": cvar,
        "histogram": {"bins": edges, "counts": counts},
    }
