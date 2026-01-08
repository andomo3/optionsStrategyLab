import pytest
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from rest_framework_simplejwt.tokens import RefreshToken

from strategies.models import StrategyLeg

User = get_user_model()


def auth_client(user):
    client = APIClient()
    refresh = RefreshToken.for_user(user)
    client.credentials(HTTP_AUTHORIZATION=f"Bearer {refresh.access_token}")
    return client


@pytest.mark.django_db
def test_strategy_crud_and_list():
    user = User.objects.create_user(username="owner", password="pass1234")
    client = auth_client(user)

    create_resp = client.post("/api/strategies/", {"name": "Core"}, format="json")
    assert create_resp.status_code == 201

    list_resp = client.get("/api/strategies/")
    assert list_resp.status_code == 200
    assert list_resp.data["count"] == 1

    strategy_id = create_resp.data["id"]
    detail_resp = client.get(f"/api/strategies/{strategy_id}/")
    assert detail_resp.status_code == 200

    patch_resp = client.patch(
        f"/api/strategies/{strategy_id}/", {"name": "Core Updated"}, format="json"
    )
    assert patch_resp.status_code == 200

    delete_resp = client.delete(f"/api/strategies/{strategy_id}/")
    assert delete_resp.status_code == 204


@pytest.mark.django_db
def test_strategy_requires_auth_for_write():
    client = APIClient()
    resp = client.post("/api/strategies/", {"name": "Nope"}, format="json")
    assert resp.status_code == 401


@pytest.mark.django_db
def test_leg_lifecycle():
    user = User.objects.create_user(username="owner2", password="pass1234")
    client = auth_client(user)

    strategy_resp = client.post("/api/strategies/", {"name": "Legs"}, format="json")
    strategy_id = strategy_resp.data["id"]

    create_leg = client.post(
        f"/api/strategies/{strategy_id}/legs/",
        {"right": "call", "strike": 100, "expiry": "2026-02-20", "quantity": 1},
        format="json",
    )
    assert create_leg.status_code == 201
    leg_id = create_leg.data["id"]

    list_legs = client.get(f"/api/strategies/{strategy_id}/legs/")
    assert list_legs.status_code == 200
    assert len(list_legs.data) == 1

    update_leg = client.patch(
        f"/api/strategies/{strategy_id}/legs/{leg_id}/",
        {"quantity": 2},
        format="json",
    )
    assert update_leg.status_code == 200
    assert update_leg.data["quantity"] == 2

    delete_leg = client.delete(f"/api/strategies/{strategy_id}/legs/{leg_id}/")
    assert delete_leg.status_code == 204
    assert StrategyLeg.objects.count() == 0
