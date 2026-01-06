from django.contrib import admin
from django.urls import include, path

from rest_framework.authtoken.views import obtain_auth_token

from common.views import health_view
from jobs.views import jobs_list_view
from market_data.views import market_data_view

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/health/", health_view, name="health"),
    path("api/", include("strategies.urls")),
    path("api/market-data/", market_data_view, name="market-data"),
    path("api/", include("pricing.urls")),
    path("api/", include("risk.urls")),
    path("api/jobs/", jobs_list_view, name="jobs-list"),
    path("api/auth/", include("users.urls")),
    path("api/auth/token/", obtain_auth_token, name="auth-token"),
]
