from typing import Dict


def build_pricing_preview(strategy_id: int) -> Dict[str, str]:
    return {
        "strategy_id": strategy_id,
        "status": "ok",
        "message": "pricing preview stub",
    }
