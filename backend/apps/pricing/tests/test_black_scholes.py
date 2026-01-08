import math

import pytest

from pricing.services.black_scholes import bs_price_call_put, delta, gamma, theta, vega
from pricing.services.implied_vol import implied_volatility


@pytest.mark.parametrize("is_call,expected", [(True, 8.4333), (False, 7.4383)])
def test_bs_price_known_value(is_call, expected):
    price = bs_price_call_put(100, 100, 0.01, 0.0, 0.2, 1.0, is_call)
    assert price == pytest.approx(expected, abs=1e-3)


def test_greeks_finite_difference():
    S, K, r, q, sigma, T = 100, 100, 0.01, 0.0, 0.2, 1.0
    h = 1e-4

    price = bs_price_call_put(S, K, r, q, sigma, T, True)
    price_up = bs_price_call_put(S + h, K, r, q, sigma, T, True)
    price_dn = bs_price_call_put(S - h, K, r, q, sigma, T, True)
    delta_fd = (price_up - price_dn) / (2 * h)
    gamma_fd = (price_up - 2 * price + price_dn) / (h * h)

    price_sig_up = bs_price_call_put(S, K, r, q, sigma + h, T, True)
    price_sig_dn = bs_price_call_put(S, K, r, q, sigma - h, T, True)
    vega_fd = (price_sig_up - price_sig_dn) / (2 * h)

    price_t_up = bs_price_call_put(S, K, r, q, sigma, T + h, True)
    price_t_dn = bs_price_call_put(S, K, r, q, sigma, T - h, True)
    theta_fd = (price_t_up - price_t_dn) / (2 * h)

    assert delta(S, K, r, q, sigma, T, True) == pytest.approx(delta_fd, rel=1e-3)
    assert gamma(S, K, r, q, sigma, T) == pytest.approx(gamma_fd, rel=1e-3)
    assert vega(S, K, r, q, sigma, T) == pytest.approx(vega_fd, rel=1e-3)
    assert theta(S, K, r, q, sigma, T, True) == pytest.approx(theta_fd, rel=1e-3)


def test_implied_vol_round_trip():
    S, K, r, q, sigma, T = 100, 100, 0.01, 0.0, 0.25, 1.0
    price = bs_price_call_put(S, K, r, q, sigma, T, True)
    implied = implied_volatility(price, S, K, r, q, T, True)
    assert implied is not None
    assert implied == pytest.approx(sigma, rel=1e-3)
