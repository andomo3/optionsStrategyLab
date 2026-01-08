from datetime import date

from django.conf import settings
from django.core.cache import cache
from rest_framework import status, viewsets
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from strategies.models import Strategy

from .models import PricingRun
from .serializers import PricingRunSerializer
from .services.black_scholes import bs_price_call_put, delta, gamma, theta, vega
from .services.hash import stable_hash
from .services.payoff import PayoffLeg, build_payoff_grid
from .services.time_utils import year_fraction
from common.throttles import PricingThrottle


class PricingPreviewView(APIView):
    permission_classes = [IsAuthenticated]
    throttle_classes = [PricingThrottle]

    def post(self, request):
        strategy_id = request.data.get("strategy_id")
        spot = request.data.get("spot")
        rate = request.data.get("r")
        dividend = request.data.get("q", 0.0)
        as_of = request.data.get("as_of")
        iv_mode = request.data.get("iv_mode")
        global_iv = request.data.get("global_iv")
        leg_overrides = request.data.get("leg_overrides", {})

        if not strategy_id:
            return Response(
                {"errors": {"strategy_id": "Strategy ID is required."}},
                status=status.HTTP_400_BAD_REQUEST,
            )
        if spot is None or rate is None or as_of is None:
            return Response(
                {"errors": {"detail": "spot, r, and as_of are required."}},
                status=status.HTTP_400_BAD_REQUEST,
            )
        if iv_mode not in {"global", "per_leg"}:
            return Response(
                {"errors": {"iv_mode": "iv_mode must be 'global' or 'per_leg'."}},
                status=status.HTTP_400_BAD_REQUEST,
            )
        if iv_mode == "global" and global_iv is None:
            return Response(
                {"errors": {"global_iv": "global_iv is required for global iv_mode."}},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            as_of_date = date.fromisoformat(as_of)
            spot_val = float(spot)
            rate_val = float(rate)
            dividend_val = float(dividend)
            global_iv_val = float(global_iv) if global_iv is not None else None
        except (ValueError, TypeError):
            return Response(
                {"errors": {"detail": "Invalid numeric or date inputs."}},
                status=status.HTTP_400_BAD_REQUEST,
            )

        strategy = Strategy.objects.filter(id=strategy_id, owner=request.user).first()
        if not strategy:
            return Response(
                {"errors": {"strategy_id": "Strategy not found."}},
                status=status.HTTP_404_NOT_FOUND,
            )

        legs = list(strategy.legs.all().order_by("id"))
        for leg in legs:
            if leg.strike is None or leg.expiry is None:
                return Response(
                    {
                        "errors": {
                            "detail": "strike and expiry are required for pricing."
                        }
                    },
                    status=status.HTTP_400_BAD_REQUEST,
                )

        cache_payload = {
            "strategy_id": strategy.id,
            "spot": spot_val,
            "r": rate_val,
            "q": dividend_val,
            "as_of": as_of,
            "iv_mode": iv_mode,
            "global_iv": global_iv_val,
            "leg_overrides": leg_overrides,
            "legs": [
                {
                    "id": leg.id,
                    "right": leg.right,
                    "strike": float(leg.strike),
                    "expiry": leg.expiry.isoformat(),
                    "quantity": leg.quantity,
                }
                for leg in legs
            ],
        }
        cache_key = f"pricing_preview:{stable_hash(cache_payload)}"
        cached_response = cache.get(cache_key)
        if cached_response:
            cached_payload = {**cached_response, "cached": True}
            return Response(cached_payload, status=status.HTTP_200_OK)

        per_leg = []
        total_price = 0.0
        total_greeks = {"delta": 0.0, "gamma": 0.0, "vega": 0.0, "theta": 0.0}

        for leg in legs:
            override = leg_overrides.get(str(leg.id), {})
            iv = override.get("iv")
            if iv is None:
                iv = global_iv_val
            if iv is None:
                return Response(
                    {"errors": {"detail": "IV is required for each leg."}},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            try:
                iv_val = float(iv)
            except (ValueError, TypeError):
                return Response(
                    {"errors": {"detail": "Invalid IV value."}},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            T = year_fraction(as_of_date, leg.expiry)
            if T <= 0:
                return Response(
                    {
                        "errors": {
                            "detail": "expiry must be after as_of for pricing."
                        }
                    },
                    status=status.HTTP_400_BAD_REQUEST,
                )
            price = bs_price_call_put(
                spot_val,
                float(leg.strike),
                rate_val,
                dividend_val,
                iv_val,
                T,
                leg.right == "call",
            )
            leg_delta = delta(
                spot_val,
                float(leg.strike),
                rate_val,
                dividend_val,
                iv_val,
                T,
                leg.right == "call",
            )
            leg_gamma = gamma(
                spot_val,
                float(leg.strike),
                rate_val,
                dividend_val,
                iv_val,
                T,
            )
            leg_vega = vega(
                spot_val,
                float(leg.strike),
                rate_val,
                dividend_val,
                iv_val,
                T,
            )
            leg_theta = theta(
                spot_val,
                float(leg.strike),
                rate_val,
                dividend_val,
                iv_val,
                T,
                leg.right == "call",
            )

            quantity = leg.quantity
            per_leg.append(
                {
                    "leg_id": leg.id,
                    "right": leg.right,
                    "strike": float(leg.strike),
                    "expiry": leg.expiry.isoformat(),
                    "quantity": quantity,
                    "iv": iv_val,
                    "price": price,
                    "greeks": {
                        "delta": leg_delta,
                        "gamma": leg_gamma,
                        "vega": leg_vega,
                        "theta": leg_theta,
                    },
                }
            )
            total_price += price * quantity
            total_greeks["delta"] += leg_delta * quantity
            total_greeks["gamma"] += leg_gamma * quantity
            total_greeks["vega"] += leg_vega * quantity
            total_greeks["theta"] += leg_theta * quantity

        response = {
            "assumptions": {
                "spot": spot_val,
                "r": rate_val,
                "q": dividend_val,
                "as_of": as_of,
            },
            "strategy": {"id": strategy.id, "name": strategy.name},
            "per_leg": per_leg,
            "totals": {"price": total_price, "greeks": total_greeks},
            "cached": False,
        }

        cache.set(cache_key, response, timeout=settings.PRICING_CACHE_TTL)
        PricingRun.objects.create(strategy=strategy)
        return Response(response, status=status.HTTP_200_OK)


class PricingRunViewSet(viewsets.ModelViewSet):
    queryset = PricingRun.objects.all().order_by("-created_at")
    serializer_class = PricingRunSerializer
    permission_classes = [IsAuthenticated]
    filterset_fields = ["strategy"]
    ordering_fields = ["created_at"]
    ordering = ["-created_at"]

    def get_queryset(self):
        if self.request.user.is_authenticated:
            return PricingRun.objects.filter(
                strategy__owner=self.request.user
            ).order_by("-created_at")
        return PricingRun.objects.none()


class PayoffGridView(APIView):
    permission_classes = [IsAuthenticated]
    throttle_classes = [PricingThrottle]

    def post(self, request):
        strategy_id = request.data.get("strategy_id")
        spot = request.data.get("spot")
        spot_min_mult = request.data.get("spot_min_mult", 0.5)
        spot_max_mult = request.data.get("spot_max_mult", 1.5)
        num_points = request.data.get("num_points", 200)

        if not strategy_id:
            return Response(
                {"errors": {"strategy_id": "Strategy ID is required."}},
                status=status.HTTP_400_BAD_REQUEST,
            )
        if spot is None:
            return Response(
                {"errors": {"spot": "spot is required."}},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            spot_val = float(spot)
            min_mult = float(spot_min_mult)
            max_mult = float(spot_max_mult)
            points = int(num_points)
        except (ValueError, TypeError):
            return Response(
                {"errors": {"detail": "Invalid numeric inputs."}},
                status=status.HTTP_400_BAD_REQUEST,
            )

        strategy = Strategy.objects.filter(id=strategy_id, owner=request.user).first()
        if not strategy:
            return Response(
                {"errors": {"strategy_id": "Strategy not found."}},
                status=status.HTTP_404_NOT_FOUND,
            )

        legs = list(strategy.legs.all().order_by("id"))
        for leg in legs:
            if leg.strike is None:
                return Response(
                    {"errors": {"detail": "strike is required for payoff."}},
                    status=status.HTTP_400_BAD_REQUEST,
                )

        cache_payload = {
            "strategy_id": strategy.id,
            "spot": spot_val,
            "spot_min_mult": min_mult,
            "spot_max_mult": max_mult,
            "num_points": points,
            "legs": [
                {
                    "id": leg.id,
                    "right": leg.right,
                    "strike": float(leg.strike),
                    "quantity": leg.quantity,
                }
                for leg in legs
            ],
        }
        cache_key = f"payoff_grid:{stable_hash(cache_payload)}"
        cached_response = cache.get(cache_key)
        if cached_response:
            cached_payload = {**cached_response, "cached": True}
            return Response(cached_payload, status=status.HTTP_200_OK)

        payoff_legs = [
            PayoffLeg(
                right=leg.right,
                strike=float(leg.strike),
                quantity=float(leg.quantity),
            )
            for leg in legs
        ]

        try:
            payload = build_payoff_grid(
                spot=spot_val,
                spot_min_mult=min_mult,
                spot_max_mult=max_mult,
                num_points=points,
                legs=payoff_legs,
            )
        except ValueError as exc:
            return Response(
                {"errors": {"detail": str(exc)}},
                status=status.HTTP_400_BAD_REQUEST,
            )

        response = {
            **payload,
            "assumptions": {
                "spot": spot_val,
                "spot_min_mult": min_mult,
                "spot_max_mult": max_mult,
                "num_points": points,
            },
            "strategy": {"id": strategy.id, "name": strategy.name},
            "cached": False,
        }
        cache.set(cache_key, response, timeout=settings.PRICING_CACHE_TTL)
        return Response(response, status=status.HTTP_200_OK)
