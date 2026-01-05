from django.contrib import admin
from django.urls import include, path

from common.views import health_view
from jobs.views import jobs_list_view
from market_data.views import market_data_view
from pricing.views import pricing_preview_view
from risk.views import risk_scenario_view

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/health/", health_view, name="health"),
    path("api/", include("strategies.urls")),
    path("api/market-data/", market_data_view, name="market-data"),
    path("api/pricing/preview/", pricing_preview_view, name="pricing-preview"),
    path("api/risk/scenario/", risk_scenario_view, name="risk-scenario"),
    path("api/jobs/", jobs_list_view, name="jobs-list"),
]
