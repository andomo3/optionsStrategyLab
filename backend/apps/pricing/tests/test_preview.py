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
def test_pricing_preview_requires_auth():
    client = APIClient()
    resp = client.post("/api/pricing/preview/", {}, format="json")
    assert resp.status_code == 401


@pytest.mark.django_db
def test_pricing_preview_validation():
    user = User.objects.create_user(username="owner", password="pass1234")
    client = auth_client(user)
    resp = client.post(
        "/api/pricing/preview/", {"strategy_id": 1}, format="json"
    )
    assert resp.status_code == 400


@pytest.mark.django_db
def test_pricing_preview_success_and_cache():
    user = User.objects.create_user(username="owner2", password="pass1234")
    strategy = Strategy.objects.create(name="Test", owner=user)
    StrategyLeg.objects.create(
        strategy=strategy,
        right="call",
        strike=100,
        expiry="2026-02-20",
        quantity=1,
    )
    client = auth_client(user)

    payload = {
        "strategy_id": strategy.id,
        "spot": 100,
        "r": 0.02,
        "q": 0.0,
        "as_of": "2026-01-06",
        "iv_mode": "global",
        "global_iv": 0.25,
        "leg_overrides": {},
    }

    first = client.post("/api/pricing/preview/", payload, format="json")
    assert first.status_code == 200
    assert first.data["cached"] is False
    assert "per_leg" in first.data
    assert "totals" in first.data

    second = client.post("/api/pricing/preview/", payload, format="json")
    assert second.status_code == 200
    assert second.data["cached"] is True
