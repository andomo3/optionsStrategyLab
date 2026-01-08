from django.urls import path
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

from .views import (
    AuthStatusView,
    DemoLoginView,
    MeView,
    RegisterView,
    SessionLoginView,
    SessionLogoutView,
)

urlpatterns = [
    path("status/", AuthStatusView.as_view(), name="auth-status"),
    path("register/", RegisterView.as_view(), name="auth-register"),
    path("login/", TokenObtainPairView.as_view(), name="auth-login"),
    path("refresh/", TokenRefreshView.as_view(), name="auth-refresh"),
    path("me/", MeView.as_view(), name="auth-me"),
    path("demo/login/", DemoLoginView.as_view(), name="demo-login"),
    path("session/login/", SessionLoginView.as_view(), name="auth-session-login"),
    path("session/logout/", SessionLogoutView.as_view(), name="auth-session-logout"),
]
