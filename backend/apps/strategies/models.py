from django.conf import settings
from django.db import models


class Strategy(models.Model):
    name = models.CharField(max_length=255, unique=True)
    owner = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="strategies",
    )
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name


class StrategyLeg(models.Model):
    strategy = models.ForeignKey(Strategy, related_name="legs", on_delete=models.CASCADE)
    right = models.CharField(max_length=8)
    strike = models.DecimalField(max_digits=12, decimal_places=4, null=True, blank=True)
    expiry = models.DateField(null=True, blank=True)
    quantity = models.IntegerField()
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.strategy.name} {self.right} x{self.quantity}"
