import pytest
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient

User = get_user_model()


@pytest.mark.django_db
def test_register_login_me_refresh_flow():
    client = APIClient()

    register_resp = client.post(
        "/api/auth/register/", {"username": "alice", "password": "pass1234"}, format="json"
    )
    assert register_resp.status_code == 201
    assert "access" in register_resp.data
    assert "refresh" in register_resp.data

    login_resp = client.post(
        "/api/auth/login/", {"username": "alice", "password": "pass1234"}, format="json"
    )
    assert login_resp.status_code == 200
    access = login_resp.data["access"]
    refresh = login_resp.data["refresh"]

    client.credentials(HTTP_AUTHORIZATION=f"Bearer {access}")
    me_resp = client.get("/api/auth/me/")
    assert me_resp.status_code == 200
    assert me_resp.data["username"] == "alice"

    refresh_resp = client.post("/api/auth/refresh/", {"refresh": refresh}, format="json")
    assert refresh_resp.status_code == 200
    assert "access" in refresh_resp.data


@pytest.mark.django_db
def test_login_invalid_credentials():
    User.objects.create_user(username="bob", password="pass1234")
    client = APIClient()
    resp = client.post(
        "/api/auth/login/", {"username": "bob", "password": "wrong"}, format="json"
    )
    assert resp.status_code == 401
