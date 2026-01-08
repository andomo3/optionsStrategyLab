from django.shortcuts import get_object_or_404
from rest_framework import status, viewsets
from rest_framework.permissions import IsAuthenticatedOrReadOnly
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Strategy, StrategyLeg
from .serializers import StrategyLegSerializer, StrategySerializer


class StrategyViewSet(viewsets.ModelViewSet):
    serializer_class = StrategySerializer
    permission_classes = [IsAuthenticatedOrReadOnly]
    search_fields = ["name"]
    ordering_fields = ["created_at", "name"]
    ordering = ["-created_at"]

    def get_queryset(self):
        if self.request.user.is_authenticated:
            return Strategy.objects.filter(owner=self.request.user).order_by("-created_at")
        return Strategy.objects.none()


class StrategyLegListCreateView(APIView):
    permission_classes = [IsAuthenticatedOrReadOnly]

    def get(self, request, strategy_id):
        strategy = get_object_or_404(Strategy, id=strategy_id, owner=request.user)
        legs = strategy.legs.all().order_by("-created_at")
        serializer = StrategyLegSerializer(legs, many=True)
        return Response(serializer.data)

    def post(self, request, strategy_id):
        strategy = get_object_or_404(Strategy, id=strategy_id, owner=request.user)
        serializer = StrategyLegSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(strategy=strategy)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class StrategyLegDetailView(APIView):
    permission_classes = [IsAuthenticatedOrReadOnly]

    def patch(self, request, strategy_id, leg_id):
        strategy = get_object_or_404(Strategy, id=strategy_id, owner=request.user)
        leg = get_object_or_404(StrategyLeg, id=leg_id, strategy=strategy)
        serializer = StrategyLegSerializer(leg, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save(strategy=strategy)
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, strategy_id, leg_id):
        strategy = get_object_or_404(Strategy, id=strategy_id, owner=request.user)
        leg = get_object_or_404(StrategyLeg, id=leg_id, strategy=strategy)
        leg.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
