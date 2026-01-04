from django.contrib import admin

from .models import Strategy, StrategyLeg


@admin.register(Strategy)
class StrategyAdmin(admin.ModelAdmin):
    list_display = ("id", "name", "created_at")
    search_fields = ("name",)


@admin.register(StrategyLeg)
class StrategyLegAdmin(admin.ModelAdmin):
    list_display = ("id", "strategy", "name", "created_at")
    search_fields = ("name",)
