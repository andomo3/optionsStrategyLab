from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):
    dependencies = [
        ("strategies", "0002_strategy_name_unique"),
    ]

    operations = [
        migrations.RemoveField(
            model_name="strategy",
            name="strategy_kind",
        ),
        migrations.AddField(
            model_name="strategy",
            name="owner",
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name="strategies",
                to=settings.AUTH_USER_MODEL,
            ),
        ),
        migrations.RemoveField(
            model_name="strategyleg",
            name="name",
        ),
        migrations.AddField(
            model_name="strategyleg",
            name="right",
            field=models.CharField(default="call", max_length=8),
            preserve_default=False,
        ),
        migrations.AddField(
            model_name="strategyleg",
            name="strike",
            field=models.DecimalField(blank=True, decimal_places=4, max_digits=12, null=True),
        ),
        migrations.AddField(
            model_name="strategyleg",
            name="expiry",
            field=models.DateField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name="strategyleg",
            name="quantity",
            field=models.IntegerField(default=1),
            preserve_default=False,
        ),
        migrations.DeleteModel(name="MomentumStrategy"),
        migrations.DeleteModel(name="MLStrategy"),
        migrations.DeleteModel(name="ArbitrageStrategy"),
    ]
