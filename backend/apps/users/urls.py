from django.urls import path

from .views import AuthStatusView, SessionLoginView, SessionLogoutView

urlpatterns = [
    path("status/", AuthStatusView.as_view(), name="auth-status"),
    path("login/", SessionLoginView.as_view(), name="auth-login"),
    path("logout/", SessionLogoutView.as_view(), name="auth-logout"),
]
