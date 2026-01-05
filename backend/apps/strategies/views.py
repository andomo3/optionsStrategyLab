from rest_framework import viewsets
from rest_framework.permissions import AllowAny

from .models import Strategy, StrategyLeg
from .serializers import StrategyLegSerializer, StrategySerializer


class StrategyViewSet(viewsets.ModelViewSet):
    queryset = Strategy.objects.all().order_by("-created_at")
    serializer_class = StrategySerializer
    permission_classes = [AllowAny]
    filterset_fields = ["strategy_kind"]
    search_fields = ["name"]
    ordering_fields = ["created_at", "name"]
    ordering = ["-created_at"]


class StrategyLegViewSet(viewsets.ModelViewSet):
    queryset = StrategyLeg.objects.all().order_by("-created_at")
    serializer_class = StrategyLegSerializer
    permission_classes = [AllowAny]
    filterset_fields = ["strategy"]
    search_fields = ["name"]
    ordering_fields = ["created_at", "name"]
    ordering = ["-created_at"]
