from rest_framework import serializers

from .models import PricingRun


class PricingRunSerializer(serializers.ModelSerializer):
    class Meta:
        model = PricingRun
        fields = ("id", "strategy", "created_at")
        read_only_fields = ("id", "created_at")
