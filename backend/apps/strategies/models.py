from django.core.exceptions import ValidationError
from django.db import models

STRATEGY_KIND_CHOICES = [
    ("momentum", "Momentum"),
    ("ml", "ML"),
    ("arbitrage", "Arbitrage"),
]


class Strategy(models.Model):
    name = models.CharField(max_length=255, unique=True)
    strategy_kind = models.CharField(
        max_length=32, choices=STRATEGY_KIND_CHOICES, default="momentum"
    )
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name

    def _subtype_models(self):
        return {
            "momentum": MomentumStrategy,
            "ml": MLStrategy,
            "arbitrage": ArbitrageStrategy,
        }

    def clean(self):
        super().clean()
        subtype_models = self._subtype_models()
        if self.strategy_kind not in subtype_models:
            raise ValidationError({"strategy_kind": "Invalid strategy kind."})
        if self.pk:
            for key, model in subtype_models.items():
                if key != self.strategy_kind and model.objects.filter(strategy=self).exists():
                    raise ValidationError(
                        "Strategy subtype mismatch: only one subtype may exist."
                    )

    def save(self, *args, **kwargs):
        if self.pk:
            self.clean()
        super().save(*args, **kwargs)
        subtype_models = self._subtype_models()
        subtype_models[self.strategy_kind].objects.get_or_create(strategy=self)


class StrategyLeg(models.Model):
    strategy = models.ForeignKey(Strategy, related_name="legs", on_delete=models.CASCADE)
    name = models.CharField(max_length=255)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.strategy.name} - {self.name}"


class MomentumStrategy(models.Model):
    strategy = models.OneToOneField(
        Strategy,
        on_delete=models.CASCADE,
        primary_key=True,
        related_name="momentum_strategy",
    )

    def __str__(self):
        return f"Momentum: {self.strategy.name}"


class MLStrategy(models.Model):
    strategy = models.OneToOneField(
        Strategy,
        on_delete=models.CASCADE,
        primary_key=True,
        related_name="ml_strategy",
    )

    def __str__(self):
        return f"ML: {self.strategy.name}"


class ArbitrageStrategy(models.Model):
    strategy = models.OneToOneField(
        Strategy,
        on_delete=models.CASCADE,
        primary_key=True,
        related_name="arbitrage_strategy",
    )

    def __str__(self):
        return f"Arbitrage: {self.strategy.name}"
