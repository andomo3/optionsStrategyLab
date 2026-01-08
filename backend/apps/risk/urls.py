from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import (
    RiskRunDetailView,
    RiskRunView,
    RiskScenarioPreviewView,
    RiskScenarioViewSet,
    StressTestResultViewSet,
)

router = DefaultRouter()
router.register("risk-scenarios", RiskScenarioViewSet, basename="risk-scenario")
router.register("stress-tests", StressTestResultViewSet, basename="stress-test")

urlpatterns = [
    path("risk/scenario/", RiskScenarioPreviewView.as_view(), name="risk-scenario"),
    path("risk/run/", RiskRunView.as_view(), name="risk-run"),
    path("risk/<int:risk_run_id>/", RiskRunDetailView.as_view(), name="risk-run-detail"),
    path("", include(router.urls)),
]
