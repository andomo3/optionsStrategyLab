from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import StrategyLegDetailView, StrategyLegListCreateView, StrategyViewSet

router = DefaultRouter()
router.register("strategies", StrategyViewSet, basename="strategy")

urlpatterns = [
    path("", include(router.urls)),
    path(
        "strategies/<int:strategy_id>/legs/",
        StrategyLegListCreateView.as_view(),
        name="strategy-legs",
    ),
    path(
        "strategies/<int:strategy_id>/legs/<int:leg_id>/",
        StrategyLegDetailView.as_view(),
        name="strategy-leg-detail",
    ),
]
