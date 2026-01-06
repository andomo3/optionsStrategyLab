from rest_framework import status, viewsets
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from strategies.models import Strategy

from .models import RiskScenario, StressTestResult
from .serializers import RiskScenarioSerializer, StressTestResultSerializer
from .services.scenario import build_risk_scenario


class RiskScenarioPreviewView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        strategy_id = request.data.get("strategy_id")
        scenario_name = request.data.get("scenario_name", "Scenario")
        spot_shift = int(request.data.get("spot_shift", 0))
        vol_shift = int(request.data.get("vol_shift", 0))
        time_shift = int(request.data.get("time_shift", 0))
        if not strategy_id:
            return Response(
                {"errors": {"strategy_id": "Strategy ID is required."}},
                status=status.HTTP_400_BAD_REQUEST,
            )
        strategy = Strategy.objects.filter(id=strategy_id).first()
        if not strategy:
            return Response(
                {"errors": {"strategy_id": "Strategy not found."}},
                status=status.HTTP_404_NOT_FOUND,
            )
        risk_scenario, _ = RiskScenario.objects.get_or_create(
            name=str(scenario_name)
        )
        StressTestResult.objects.create(
            strategy=strategy,
            risk_scenario=risk_scenario,
            spot_shift=spot_shift,
            vol_shift=vol_shift,
            time_shift=time_shift,
        )
        payload = build_risk_scenario(int(strategy_id), str(scenario_name))
        payload["spot_shift"] = spot_shift
        payload["vol_shift"] = vol_shift
        payload["time_shift"] = time_shift
        return Response(payload, status=status.HTTP_200_OK)


class RiskScenarioViewSet(viewsets.ModelViewSet):
    queryset = RiskScenario.objects.all().order_by("-created_at")
    serializer_class = RiskScenarioSerializer
    permission_classes = [AllowAny]
    search_fields = ["name"]
    ordering_fields = ["created_at", "name"]
    ordering = ["-created_at"]


class StressTestResultViewSet(viewsets.ModelViewSet):
    queryset = StressTestResult.objects.all().order_by("-created_at")
    serializer_class = StressTestResultSerializer
    permission_classes = [AllowAny]
    filterset_fields = ["strategy", "risk_scenario"]
    ordering_fields = ["created_at"]
    ordering = ["-created_at"]
