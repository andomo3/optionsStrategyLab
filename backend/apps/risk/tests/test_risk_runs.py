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
def test_risk_run_requires_auth():
    client = APIClient()
    resp = client.post("/api/risk/run/", {}, format="json")
    assert resp.status_code == 401


@pytest.mark.django_db
def test_risk_run_create_and_fetch(monkeypatch):
    user = User.objects.create_user(username="owner", password="pass1234")
    strategy = Strategy.objects.create(name="Test", owner=user)
    StrategyLeg.objects.create(
        strategy=strategy,
        right="call",
        strike=100,
        expiry="2026-02-20",
        quantity=1,
    )
    client = auth_client(user)

    class DummyJob:
        id = "job-1"

    def fake_delay(_risk_run_id):
        return DummyJob()

    monkeypatch.setattr("risk.views.run_risk_gbm.delay", fake_delay)

    payload = {
        "strategy_id": strategy.id,
        "spot": 100,
        "r": 0.02,
        "q": 0.0,
        "sigma": 0.25,
        "as_of": "2026-01-06",
        "horizon_days": 30,
        "paths": 1000,
    }

    resp = client.post("/api/risk/run/", payload, format="json")
    assert resp.status_code == 202
    risk_run_id = resp.data["risk_run_id"]

    detail = client.get(f"/api/risk/{risk_run_id}/")
    assert detail.status_code == 200
    assert detail.data["id"] == risk_run_id
    assert detail.data["status"] == "PENDING"
