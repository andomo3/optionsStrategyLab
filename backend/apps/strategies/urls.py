from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import StrategyLegViewSet, StrategyViewSet

router = DefaultRouter()
router.register("strategies", StrategyViewSet, basename="strategy")
router.register("strategy-legs", StrategyLegViewSet, basename="strategy-leg")

urlpatterns = [
    path("", include(router.urls)),
]
