import math
import random
from dataclasses import dataclass
from datetime import date, timedelta
from typing import Iterable, List

from pricing.services.black_scholes import bs_price_call_put
from pricing.services.time_utils import year_fraction


@dataclass(frozen=True)
class RiskLeg:
    right: str
    strike: float
    expiry: date
    quantity: float


def simulate_terminal_prices(
    *,
    spot: float,
    r: float,
    q: float,
    sigma: float,
    horizon_days: int,
    paths: int,
    seed: int | None = None,
) -> List[float]:
    if seed is not None:
        random.seed(seed)
    T = max(horizon_days / 365.0, 0.0)
    mu = (r - q - 0.5 * sigma * sigma) * T
    vol = sigma * math.sqrt(T)

    prices: List[float] = []
    for _ in range(paths):
        z = random.gauss(0.0, 1.0)
        st = spot * math.exp(mu + vol * z)
        prices.append(st)
    return prices


def price_strategy_at_horizon(
    *,
    spot: float,
    r: float,
    q: float,
    sigma: float,
    as_of: date,
    horizon_days: int,
    legs: Iterable[RiskLeg],
) -> float:
    horizon_date = as_of + timedelta(days=horizon_days)
    total = 0.0
    for leg in legs:
        remaining = year_fraction(horizon_date, leg.expiry)
        if remaining > 0:
            price = bs_price_call_put(
                spot,
                leg.strike,
                r,
                q,
                sigma,
                remaining,
                leg.right == "call",
            )
        else:
            if leg.right == "call":
                price = max(spot - leg.strike, 0.0)
            else:
                price = max(leg.strike - spot, 0.0)
        total += price * leg.quantity
    return total


def price_strategy_now(
    *,
    spot: float,
    r: float,
    q: float,
    sigma: float,
    as_of: date,
    legs: Iterable[RiskLeg],
) -> float:
    total = 0.0
    for leg in legs:
        remaining = year_fraction(as_of, leg.expiry)
        if remaining > 0:
            price = bs_price_call_put(
                spot,
                leg.strike,
                r,
                q,
                sigma,
                remaining,
                leg.right == "call",
            )
        else:
            if leg.right == "call":
                price = max(spot - leg.strike, 0.0)
            else:
                price = max(leg.strike - spot, 0.0)
        total += price * leg.quantity
    return total
