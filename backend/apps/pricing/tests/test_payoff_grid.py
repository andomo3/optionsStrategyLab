import pytest
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from rest_framework_simplejwt.tokens import RefreshToken

from strategies.models import Strategy, StrategyLeg

User = get_user_model()


def auth_client(user):
    client = APIClient()
    refresh = RefreshToken.for_user(user)
    client.credentials(HTTP_AUTHORIZATION=f"Bearer {refresh.access_token}")
    return client


@pytest.mark.django_db
def test_payoff_grid_requires_auth():
    client = APIClient()
    resp = client.post("/api/pricing/payoff-grid/", {}, format="json")
    assert resp.status_code == 401


@pytest.mark.django_db
def test_payoff_grid_validation():
    user = User.objects.create_user(username="owner", password="pass1234")
    strategy = Strategy.objects.create(name="Test", owner=user)
    StrategyLeg.objects.create(strategy=strategy, right="call", strike=100, quantity=1)
    client = auth_client(user)

    resp = client.post("/api/pricing/payoff-grid/", {"strategy_id": strategy.id}, format="json")
    assert resp.status_code == 400


@pytest.mark.django_db
def test_payoff_grid_success_and_cache():
    user = User.objects.create_user(username="owner2", password="pass1234")
    strategy = Strategy.objects.create(name="Test", owner=user)
    StrategyLeg.objects.create(strategy=strategy, right="call", strike=100, quantity=1)
    client = auth_client(user)

    payload = {
        "strategy_id": strategy.id,
        "spot": 100,
        "spot_min_mult": 0.5,
        "spot_max_mult": 1.5,
        "num_points": 5,
    }

    first = client.post("/api/pricing/payoff-grid/", payload, format="json")
    assert first.status_code == 200
    assert first.data["cached"] is False
    assert len(first.data["grid"]) == 5
    assert len(first.data["pnl"]) == 5
    assert any(abs(value - 100) < 1e-3 for value in first.data["breakevens"])

    second = client.post("/api/pricing/payoff-grid/", payload, format="json")
    assert second.status_code == 200
    assert second.data["cached"] is True
