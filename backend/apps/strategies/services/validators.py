from typing import Optional


def validate_right(value: str) -> None:
    if value not in {"call", "put"}:
        raise ValueError("right must be 'call' or 'put'.")


def validate_quantity(value: int) -> None:
    if value == 0:
        raise ValueError("quantity must be non-zero.")


def validate_strike(value: Optional[float]) -> None:
    if value is not None and value <= 0:
        raise ValueError("strike must be greater than 0.")
