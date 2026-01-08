from django.conf import settings
from django.core.management.base import BaseCommand

from strategies.models import Strategy, StrategyLeg
from django.contrib.auth import get_user_model

User = get_user_model()


class Command(BaseCommand):
    help = "Seed demo user with example strategies."

    def add_arguments(self, parser):
        parser.add_argument("--username", default=settings.DEMO_USERNAME)
        parser.add_argument("--password", default=settings.DEMO_PASSWORD)

    def handle(self, *args, **options):
        username = options["username"]
        password = options["password"]

        user, created = User.objects.get_or_create(username=username)
        if created:
            user.set_password(password)
            user.save()
            self.stdout.write(self.style.SUCCESS(f"Created demo user '{username}'."))
        else:
            self.stdout.write(self.style.WARNING(f"Demo user '{username}' already exists."))

        if Strategy.objects.filter(owner=user).exists():
            self.stdout.write(self.style.WARNING("Demo strategies already exist."))
            return

        strategies = [
            {
                "name": "Demo Call Spread",
                "legs": [
                    {"right": "call", "strike": 95, "expiry": "2026-03-20", "quantity": 1},
                    {"right": "call", "strike": 110, "expiry": "2026-03-20", "quantity": -1},
                ],
            },
            {
                "name": "Demo Put Spread",
                "legs": [
                    {"right": "put", "strike": 105, "expiry": "2026-03-20", "quantity": 1},
                    {"right": "put", "strike": 95, "expiry": "2026-03-20", "quantity": -1},
                ],
            },
            {
                "name": "Demo Straddle",
                "legs": [
                    {"right": "call", "strike": 100, "expiry": "2026-03-20", "quantity": 1},
                    {"right": "put", "strike": 100, "expiry": "2026-03-20", "quantity": 1},
                ],
            },
        ]

        for entry in strategies:
            strategy = Strategy.objects.create(name=entry["name"], owner=user)
            for leg in entry["legs"]:
                StrategyLeg.objects.create(strategy=strategy, **leg)

        self.stdout.write(self.style.SUCCESS("Seeded demo strategies."))
