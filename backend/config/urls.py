from django.conf import settings
from django.contrib import admin
from django.urls import include, path

from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView
from rest_framework.authtoken.views import obtain_auth_token

from common.views import health_view
from jobs.views import jobs_list_view
from market_data.views import market_data_view

urlpatterns = [
    path(settings.DJANGO_ADMIN_URL, admin.site.urls),
    path("api/health/", health_view, name="health"),
    path("api/", include("strategies.urls")),
    path("api/market-data/", market_data_view, name="market-data"),
    path("api/", include("pricing.urls")),
    path("api/", include("risk.urls")),
    path("api/jobs/", jobs_list_view, name="jobs-list"),
    path("api/auth/", include("users.urls")),
    path("api/auth/token/", obtain_auth_token, name="auth-token"),
    path("api/schema/", SpectacularAPIView.as_view(), name="schema"),
    path(
        "api/schema/docs/",
        SpectacularSwaggerView.as_view(url_name="schema"),
        name="schema-docs",
    ),
]
