from datetime import date

from rest_framework import status, viewsets
from rest_framework.permissions import IsAuthenticated, IsAuthenticatedOrReadOnly
from rest_framework.response import Response
from rest_framework.views import APIView

from strategies.models import Strategy

from .models import RiskRun, RiskScenario, StressTestResult
from .serializers import RiskRunSerializer, RiskScenarioSerializer, StressTestResultSerializer
from .services.scenario import build_risk_scenario
from .tasks import run_risk_gbm
from common.throttles import RiskRunThrottle


class RiskScenarioPreviewView(APIView):
    permission_classes = [IsAuthenticated]

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
        strategy = Strategy.objects.filter(id=strategy_id, owner=request.user).first()
        if not strategy:
            return Response(
                {"errors": {"strategy_id": "Strategy not found."}},
                status=status.HTTP_404_NOT_FOUND,
            )
        if strategy.legs.filter(strike__isnull=True).exists() or strategy.legs.filter(
            expiry__isnull=True
        ).exists():
            return Response(
                {"errors": {"detail": "strike and expiry are required for risk runs."}},
                status=status.HTTP_400_BAD_REQUEST,
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
    permission_classes = [IsAuthenticatedOrReadOnly]
    search_fields = ["name"]
    ordering_fields = ["created_at", "name"]
    ordering = ["-created_at"]


class StressTestResultViewSet(viewsets.ModelViewSet):
    queryset = StressTestResult.objects.all().order_by("-created_at")
    serializer_class = StressTestResultSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]
    filterset_fields = ["strategy", "risk_scenario"]
    ordering_fields = ["created_at"]
    ordering = ["-created_at"]

    def get_queryset(self):
        if self.request.user.is_authenticated:
            return StressTestResult.objects.filter(
                strategy__owner=self.request.user
            ).order_by("-created_at")
        return StressTestResult.objects.none()


class RiskRunView(APIView):
    permission_classes = [IsAuthenticated]
    throttle_classes = [RiskRunThrottle]

    def post(self, request):
        strategy_id = request.data.get("strategy_id")
        if not strategy_id:
            return Response(
                {"errors": {"strategy_id": "Strategy ID is required."}},
                status=status.HTTP_400_BAD_REQUEST,
            )
        strategy = Strategy.objects.filter(id=strategy_id, owner=request.user).first()
        if not strategy:
            return Response(
                {"errors": {"strategy_id": "Strategy not found."}},
                status=status.HTTP_404_NOT_FOUND,
            )

        try:
            spot = float(request.data.get("spot", 100))
            rate = float(request.data.get("r", 0.02))
            dividend = float(request.data.get("q", 0.0))
            sigma = float(request.data.get("sigma", request.data.get("global_iv", 0.25)))
            as_of = request.data.get("as_of", date.today().isoformat())
            as_of_date = date.fromisoformat(as_of)
            horizon_days = int(request.data.get("horizon_days", 30))
            paths = int(request.data.get("paths", 5000))
            seed = request.data.get("seed")
            if seed is not None:
                seed = int(seed)
        except (TypeError, ValueError):
            return Response(
                {"errors": {"detail": "Invalid numeric inputs."}},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if spot <= 0 or sigma <= 0:
            return Response(
                {"errors": {"detail": "spot and sigma must be positive."}},
                status=status.HTTP_400_BAD_REQUEST,
            )
        if horizon_days <= 0 or horizon_days > 365:
            return Response(
                {"errors": {"detail": "horizon_days must be between 1 and 365."}},
                status=status.HTTP_400_BAD_REQUEST,
            )
        if paths < 100 or paths > 100000:
            return Response(
                {"errors": {"detail": "paths must be between 100 and 100000."}},
                status=status.HTTP_400_BAD_REQUEST,
            )

        risk_run = RiskRun.objects.create(
            strategy=strategy,
            owner=request.user,
            params={
                "spot": spot,
                "r": rate,
                "q": dividend,
                "sigma": sigma,
                "as_of": as_of_date.isoformat(),
                "horizon_days": horizon_days,
                "paths": paths,
                "seed": seed,
                "model_preset": request.data.get("model_preset"),
            },
        )
        job = run_risk_gbm.delay(risk_run.id)
        return Response(
            {"risk_run_id": risk_run.id, "job_id": job.id},
            status=status.HTTP_202_ACCEPTED,
        )


class RiskRunDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, risk_run_id: int):
        risk_run = RiskRun.objects.filter(
            id=risk_run_id, owner=request.user
        ).first()
        if not risk_run:
            return Response(
                {"errors": {"detail": "Risk run not found."}},
                status=status.HTTP_404_NOT_FOUND,
            )
        serializer = RiskRunSerializer(risk_run)
        return Response(serializer.data, status=status.HTTP_200_OK)
