from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import RiskScenarioPreviewView, RiskScenarioViewSet, StressTestResultViewSet

router = DefaultRouter()
router.register("risk-scenarios", RiskScenarioViewSet, basename="risk-scenario")
router.register("stress-tests", StressTestResultViewSet, basename="stress-test")

urlpatterns = [
    path("risk/scenario/", RiskScenarioPreviewView.as_view(), name="risk-scenario"),
    path("", include(router.urls)),
]
