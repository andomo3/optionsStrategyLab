from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("risk", "0001_initial"),
    ]

    operations = [
        migrations.AddField(
            model_name="stresstestresult",
            name="spot_shift",
            field=models.IntegerField(default=0),
        ),
        migrations.AddField(
            model_name="stresstestresult",
            name="time_shift",
            field=models.IntegerField(default=0),
        ),
        migrations.AddField(
            model_name="stresstestresult",
            name="vol_shift",
            field=models.IntegerField(default=0),
        ),
    ]
