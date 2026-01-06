from rest_framework import serializers

from .models import RiskScenario, StressTestResult


class RiskScenarioSerializer(serializers.ModelSerializer):
    class Meta:
        model = RiskScenario
        fields = ("id", "name", "created_at")
        read_only_fields = ("id", "created_at")


class StressTestResultSerializer(serializers.ModelSerializer):
    class Meta:
        model = StressTestResult
        fields = (
            "id",
            "strategy",
            "risk_scenario",
            "spot_shift",
            "vol_shift",
            "time_shift",
            "created_at",
        )
        read_only_fields = ("id", "created_at")
