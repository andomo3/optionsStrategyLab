from typing import Dict


def build_risk_scenario(strategy_id: int, scenario_name: str) -> Dict[str, str]:
    return {
        "strategy_id": strategy_id,
        "scenario_name": scenario_name,
        "status": "ok",
        "message": "risk scenario stub",
    }
