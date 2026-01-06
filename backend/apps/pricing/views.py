from rest_framework import status, viewsets
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from strategies.models import Strategy

from .models import PricingRun
from .serializers import PricingRunSerializer
from .services.preview import build_pricing_preview


class PricingPreviewView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        strategy_id = request.data.get("strategy_id")
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
        PricingRun.objects.create(strategy=strategy)
        payload = build_pricing_preview(int(strategy_id))
        return Response(payload, status=status.HTTP_200_OK)


class PricingRunViewSet(viewsets.ModelViewSet):
    queryset = PricingRun.objects.all().order_by("-created_at")
    serializer_class = PricingRunSerializer
    permission_classes = [AllowAny]
    filterset_fields = ["strategy"]
    ordering_fields = ["created_at"]
    ordering = ["-created_at"]
