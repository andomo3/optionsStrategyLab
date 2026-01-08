from django.db import transaction
from rest_framework import serializers

from .models import Strategy, StrategyLeg
from .services.validators import validate_quantity, validate_right, validate_strike


class StrategyLegSerializer(serializers.ModelSerializer):
    strategy = serializers.PrimaryKeyRelatedField(
        queryset=Strategy.objects.all(), required=False
    )

    class Meta:
        model = StrategyLeg
        fields = (
            "id",
            "strategy",
            "right",
            "strike",
            "expiry",
            "quantity",
            "created_at",
        )
        read_only_fields = ("id", "created_at")

    def validate(self, attrs):
        right = attrs.get("right")
        strike = attrs.get("strike")
        quantity = attrs.get("quantity")
        try:
            if right is not None:
                validate_right(right)
            if strike is not None:
                validate_strike(float(strike))
            if quantity is not None:
                validate_quantity(int(quantity))
        except ValueError as exc:
            raise serializers.ValidationError(str(exc)) from exc
        return attrs


class StrategySerializer(serializers.ModelSerializer):
    legs = StrategyLegSerializer(many=True, read_only=True)

    class Meta:
        model = Strategy
        fields = ("id", "name", "owner", "created_at", "legs")
        read_only_fields = ("id", "created_at", "owner")

    @transaction.atomic
    def create(self, validated_data):
        name = validated_data.get("name", "").strip()
        if len(name) < 3:
            raise serializers.ValidationError(
                {"name": "Strategy name must be at least 3 characters."}
            )
        validated_data["name"] = name
        request = self.context.get("request")
        if request and request.user.is_authenticated:
            validated_data["owner"] = request.user
        strategy = Strategy.objects.create(**validated_data)
        return strategy

    @transaction.atomic
    def update(self, instance, validated_data):
        for attr, value in validated_data.items():
            if attr == "name":
                value = value.strip()
                if len(value) < 3:
                    raise serializers.ValidationError(
                        {"name": "Strategy name must be at least 3 characters."}
                    )
            setattr(instance, attr, value)
        instance.save()
        return instance
