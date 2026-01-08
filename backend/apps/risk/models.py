from django.conf import settings
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
    spot_shift = models.IntegerField(default=0)
    vol_shift = models.IntegerField(default=0)
    time_shift = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"StressTestResult {self.id}"


class RiskRun(models.Model):
    STATUS_PENDING = "PENDING"
    STATUS_RUNNING = "RUNNING"
    STATUS_SUCCEEDED = "SUCCEEDED"
    STATUS_FAILED = "FAILED"

    STATUS_CHOICES = (
        (STATUS_PENDING, "Pending"),
        (STATUS_RUNNING, "Running"),
        (STATUS_SUCCEEDED, "Succeeded"),
        (STATUS_FAILED, "Failed"),
    )

    strategy = models.ForeignKey(
        Strategy, related_name="risk_runs", on_delete=models.CASCADE
    )
    owner = models.ForeignKey(
        settings.AUTH_USER_MODEL, related_name="risk_runs", on_delete=models.CASCADE
    )
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default=STATUS_PENDING)
    params = models.JSONField(default=dict)
    summary = models.JSONField(null=True, blank=True)
    error_message = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"RiskRun {self.id} ({self.status})"
