from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import PayoffGridView, PricingPreviewView, PricingRunViewSet

router = DefaultRouter()
router.register("pricing-runs", PricingRunViewSet, basename="pricing-run")

urlpatterns = [
    path("pricing/preview/", PricingPreviewView.as_view(), name="pricing-preview"),
    path("pricing/payoff-grid/", PayoffGridView.as_view(), name="pricing-payoff-grid"),
    path("", include(router.urls)),
]
