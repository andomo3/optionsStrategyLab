from django.db import models

from strategies.models import Strategy


class RiskScenario(models.Model):
    name = models.CharField(max_length=255)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name


class StressTestResult(models.Model):
    strategy = models.ForeignKey(
        Strategy, related_name="stress_test_results", on_delete=models.CASCADE
    )
    risk_scenario = models.ForeignKey(
        RiskScenario, related_name="stress_test_results", on_delete=models.CASCADE
    )
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"StressTestResult {self.id}"
