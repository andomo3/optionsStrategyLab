from rest_framework import serializers

from .models import RiskRun, RiskScenario, StressTestResult


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


class RiskRunSerializer(serializers.ModelSerializer):
    class Meta:
        model = RiskRun
        fields = (
            "id",
            "strategy",
            "owner",
            "status",
            "params",
            "summary",
            "error_message",
            "created_at",
            "updated_at",
        )
        read_only_fields = ("id", "owner", "status", "summary", "error_message", "created_at", "updated_at")
