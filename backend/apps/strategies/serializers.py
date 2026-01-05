from django.db import transaction
from rest_framework import serializers

from .models import Strategy, StrategyLeg


class StrategyLegSerializer(serializers.ModelSerializer):
    strategy = serializers.PrimaryKeyRelatedField(
        queryset=Strategy.objects.all(), required=False
    )

    class Meta:
        model = StrategyLeg
        fields = ("id", "name", "created_at", "strategy")
        read_only_fields = ("id", "created_at")

    def validate_name(self, value):
        if len(value.strip()) < 2:
            raise serializers.ValidationError("Leg name must be at least 2 characters.")
        return value


class StrategySerializer(serializers.ModelSerializer):
    legs = StrategyLegSerializer(many=True, required=False)

    class Meta:
        model = Strategy
        fields = ("id", "name", "strategy_kind", "created_at", "legs")
        read_only_fields = ("id", "created_at")

    @transaction.atomic
    def create(self, validated_data):
        legs_data = validated_data.pop("legs", [])
        name = validated_data.get("name", "").strip()
        if len(name) < 3:
            raise serializers.ValidationError(
                {"name": "Strategy name must be at least 3 characters."}
            )
        if not legs_data:
            raise serializers.ValidationError(
                {"legs": "At least one leg is required."}
            )
        validated_data["name"] = name
        strategy = Strategy.objects.create(**validated_data)
        for leg_data in legs_data:
            leg_data.pop("strategy", None)
            StrategyLeg.objects.create(strategy=strategy, **leg_data)
        return strategy

    @transaction.atomic
    def update(self, instance, validated_data):
        legs_data = validated_data.pop("legs", None)
        for attr, value in validated_data.items():
            if attr == "name":
                value = value.strip()
                if len(value) < 3:
                    raise serializers.ValidationError(
                        {"name": "Strategy name must be at least 3 characters."}
                    )
            setattr(instance, attr, value)
        instance.save()

        if legs_data is not None:
            if not legs_data:
                raise serializers.ValidationError(
                    {"legs": "At least one leg is required."}
                )
            instance.legs.all().delete()
            for leg_data in legs_data:
                leg_data.pop("strategy", None)
                StrategyLeg.objects.create(strategy=instance, **leg_data)
        return instance
