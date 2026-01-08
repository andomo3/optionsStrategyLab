from django.contrib import admin

from .models import Strategy, StrategyLeg


@admin.register(Strategy)
class StrategyAdmin(admin.ModelAdmin):
    list_display = ("id", "name", "owner", "created_at")
    search_fields = ("name",)


@admin.register(StrategyLeg)
class StrategyLegAdmin(admin.ModelAdmin):
    list_display = ("id", "strategy", "right", "strike", "expiry", "quantity", "created_at")
