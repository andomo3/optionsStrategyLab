from django.db import models

from strategies.models import Strategy


class PricingRun(models.Model):
    strategy = models.ForeignKey(
        Strategy, related_name="pricing_runs", on_delete=models.CASCADE
    )
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"PricingRun {self.id} for {self.strategy.name}"
