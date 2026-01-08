import math
from typing import Optional

from scipy.optimize import brentq

from .black_scholes import bs_price_call_put


def implied_volatility(
    price: float,
    S: float,
    K: float,
    r: float,
    q: float,
    T: float,
    is_call: bool,
    sigma_min: float = 1e-6,
    sigma_max: float = 5.0,
) -> Optional[float]:
    if price <= 0:
        return None

    def objective(sigma: float) -> float:
        return bs_price_call_put(S, K, r, q, sigma, T, is_call) - price

    try:
        return brentq(objective, sigma_min, sigma_max, maxiter=200)
    except ValueError:
        return None


def forward_price(S: float, r: float, q: float, T: float) -> float:
    return S * math.exp((r - q) * T)
