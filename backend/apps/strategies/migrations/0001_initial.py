from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):
    initial = True

    dependencies = []

    operations = [
        migrations.CreateModel(
            name="Strategy",
            fields=[
                (
                    "id",
                    models.BigAutoField(
                        auto_created=True,
                        primary_key=True,
                        serialize=False,
                        verbose_name="ID",
                    ),
                ),
                ("name", models.CharField(max_length=255)),
                (
                    "strategy_kind",
                    models.CharField(
                        choices=[
                            ("momentum", "Momentum"),
                            ("ml", "ML"),
                            ("arbitrage", "Arbitrage"),
                        ],
                        default="momentum",
                        max_length=32,
                    ),
                ),
                ("created_at", models.DateTimeField(auto_now_add=True)),
            ],
        ),
        migrations.CreateModel(
            name="StrategyLeg",
            fields=[
                (
                    "id",
                    models.BigAutoField(
                        auto_created=True,
                        primary_key=True,
                        serialize=False,
                        verbose_name="ID",
                    ),
                ),
                ("name", models.CharField(max_length=255)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                (
                    "strategy",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="legs",
                        to="strategies.strategy",
                    ),
                ),
            ],
        ),
        migrations.CreateModel(
            name="MomentumStrategy",
            fields=[
                (
                    "strategy",
                    models.OneToOneField(
                        on_delete=django.db.models.deletion.CASCADE,
                        primary_key=True,
                        related_name="momentum_strategy",
                        serialize=False,
                        to="strategies.strategy",
                    ),
                ),
            ],
        ),
        migrations.CreateModel(
            name="MLStrategy",
            fields=[
                (
                    "strategy",
                    models.OneToOneField(
                        on_delete=django.db.models.deletion.CASCADE,
                        primary_key=True,
                        related_name="ml_strategy",
                        serialize=False,
                        to="strategies.strategy",
                    ),
                ),
            ],
        ),
        migrations.CreateModel(
            name="ArbitrageStrategy",
            fields=[
                (
                    "strategy",
                    models.OneToOneField(
                        on_delete=django.db.models.deletion.CASCADE,
                        primary_key=True,
                        related_name="arbitrage_strategy",
                        serialize=False,
                        to="strategies.strategy",
                    ),
                ),
            ],
        ),
    ]
