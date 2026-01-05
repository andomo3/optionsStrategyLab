from django.contrib import admin

from .models import (
    ArbitrageStrategy,
    MLStrategy,
    MomentumStrategy,
    Strategy,
    StrategyLeg,
)


@admin.register(Strategy)
class StrategyAdmin(admin.ModelAdmin):
    list_display = ("id", "name", "strategy_kind", "created_at")
    search_fields = ("name",)


@admin.register(StrategyLeg)
class StrategyLegAdmin(admin.ModelAdmin):
    list_display = ("id", "strategy", "name", "created_at")
    search_fields = ("name",)


@admin.register(MomentumStrategy)
class MomentumStrategyAdmin(admin.ModelAdmin):
    list_display = ("strategy",)


@admin.register(MLStrategy)
class MLStrategyAdmin(admin.ModelAdmin):
    list_display = ("strategy",)


@admin.register(ArbitrageStrategy)
class ArbitrageStrategyAdmin(admin.ModelAdmin):
    list_display = ("strategy",)
