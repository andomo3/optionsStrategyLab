from django.contrib import admin

from .models import RiskScenario, StressTestResult


@admin.register(RiskScenario)
class RiskScenarioAdmin(admin.ModelAdmin):
    list_display = ("id", "name", "created_at")
    search_fields = ("name",)


@admin.register(StressTestResult)
class StressTestResultAdmin(admin.ModelAdmin):
    list_display = ("id", "strategy", "risk_scenario", "created_at")
