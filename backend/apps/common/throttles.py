from rest_framework.throttling import UserRateThrottle


class PricingThrottle(UserRateThrottle):
    scope = "pricing"


class RiskRunThrottle(UserRateThrottle):
    scope = "risk_run"
