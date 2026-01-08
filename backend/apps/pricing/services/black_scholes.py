import math
from typing import Tuple

from scipy.stats import norm


def _d1_d2(S: float, K: float, r: float, q: float, sigma: float, T: float) -> Tuple[float, float]:
    if T <= 0 or sigma <= 0 or S <= 0 or K <= 0:
        raise ValueError("Invalid inputs for Black-Scholes.")
    vol_sqrt = sigma * math.sqrt(T)
    d1 = (math.log(S / K) + (r - q + 0.5 * sigma * sigma) * T) / vol_sqrt
    d2 = d1 - vol_sqrt
    return d1, d2


def bs_price_call_put(S: float, K: float, r: float, q: float, sigma: float, T: float, is_call: bool) -> float:
    d1, d2 = _d1_d2(S, K, r, q, sigma, T)
    df_q = math.exp(-q * T)
    df_r = math.exp(-r * T)
    if is_call:
        return df_q * S * norm.cdf(d1) - df_r * K * norm.cdf(d2)
    return df_r * K * norm.cdf(-d2) - df_q * S * norm.cdf(-d1)


def delta(S: float, K: float, r: float, q: float, sigma: float, T: float, is_call: bool) -> float:
    d1, _ = _d1_d2(S, K, r, q, sigma, T)
    df_q = math.exp(-q * T)
    if is_call:
        return df_q * norm.cdf(d1)
    return df_q * (norm.cdf(d1) - 1.0)


def gamma(S: float, K: float, r: float, q: float, sigma: float, T: float) -> float:
    d1, _ = _d1_d2(S, K, r, q, sigma, T)
    df_q = math.exp(-q * T)
    return df_q * norm.pdf(d1) / (S * sigma * math.sqrt(T))


def vega(S: float, K: float, r: float, q: float, sigma: float, T: float) -> float:
    d1, _ = _d1_d2(S, K, r, q, sigma, T)
    df_q = math.exp(-q * T)
    return df_q * S * norm.pdf(d1) * math.sqrt(T)


def theta(S: float, K: float, r: float, q: float, sigma: float, T: float, is_call: bool) -> float:
    d1, d2 = _d1_d2(S, K, r, q, sigma, T)
    df_q = math.exp(-q * T)
    df_r = math.exp(-r * T)
    term1 = -df_q * S * norm.pdf(d1) * sigma / (2 * math.sqrt(T))
    if is_call:
        term2 = q * df_q * S * norm.cdf(d1)
        term3 = -r * df_r * K * norm.cdf(d2)
    else:
        term2 = -q * df_q * S * norm.cdf(-d1)
        term3 = r * df_r * K * norm.cdf(-d2)
    return term1 + term2 + term3
