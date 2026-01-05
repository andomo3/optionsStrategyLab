from django.contrib import admin

from .models import PricingRun


@admin.register(PricingRun)
class PricingRunAdmin(admin.ModelAdmin):
    list_display = ("id", "strategy", "created_at")
