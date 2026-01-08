from datetime import date

from celery import shared_task

from strategies.models import StrategyLeg

from .models import RiskRun
from .services.gbm import RiskLeg, price_strategy_at_horizon, price_strategy_now, simulate_terminal_prices
from .services.metrics import summarize_distribution


@shared_task(bind=True)
def run_risk_gbm(self, risk_run_id: int):
    risk_run = RiskRun.objects.select_related("strategy", "owner").get(id=risk_run_id)
    risk_run.status = RiskRun.STATUS_RUNNING
    risk_run.error_message = ""
    risk_run.save(update_fields=["status", "error_message", "updated_at"])

    params = risk_run.params or {}
    try:
        spot = float(params.get("spot"))
        r = float(params.get("r"))
        q = float(params.get("q"))
        sigma = float(params.get("sigma"))
        as_of = date.fromisoformat(params.get("as_of"))
        horizon_days = int(params.get("horizon_days"))
        paths = int(params.get("paths"))
        seed = params.get("seed")
        if seed is not None:
            seed = int(seed)
    except (TypeError, ValueError) as exc:
        risk_run.status = RiskRun.STATUS_FAILED
        risk_run.error_message = f"Invalid params: {exc}"
        risk_run.save(update_fields=["status", "error_message", "updated_at"])
        return

    legs = list(StrategyLeg.objects.filter(strategy=risk_run.strategy).order_by("id"))
    try:
        risk_legs = [
            RiskLeg(
                right=leg.right,
                strike=float(leg.strike),
                expiry=leg.expiry,
                quantity=float(leg.quantity),
            )
            for leg in legs
        ]
    except (TypeError, ValueError):
        risk_run.status = RiskRun.STATUS_FAILED
        risk_run.error_message = "Leg strike and expiry are required."
        risk_run.save(update_fields=["status", "error_message", "updated_at"])
        return

    try:
        base_value = price_strategy_now(
            spot=spot, r=r, q=q, sigma=sigma, as_of=as_of, legs=risk_legs
        )
        terminal_prices = simulate_terminal_prices(
            spot=spot,
            r=r,
            q=q,
            sigma=sigma,
            horizon_days=horizon_days,
            paths=paths,
            seed=seed,
        )
        pnl = []
        for st in terminal_prices:
            horizon_value = price_strategy_at_horizon(
                spot=st,
                r=r,
                q=q,
                sigma=sigma,
                as_of=as_of,
                horizon_days=horizon_days,
                legs=risk_legs,
            )
            pnl.append(horizon_value - base_value)
        summary = summarize_distribution(pnl)
        summary["inputs"] = {
            "spot": spot,
            "r": r,
            "q": q,
            "sigma": sigma,
            "as_of": as_of.isoformat(),
            "horizon_days": horizon_days,
            "paths": paths,
        }
        risk_run.summary = summary
        risk_run.status = RiskRun.STATUS_SUCCEEDED
        risk_run.save(update_fields=["summary", "status", "updated_at"])
    except Exception as exc:  # noqa: BLE001 - surface task failure
        risk_run.status = RiskRun.STATUS_FAILED
        risk_run.error_message = str(exc)
        risk_run.save(update_fields=["status", "error_message", "updated_at"])
