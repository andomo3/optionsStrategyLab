from datetime import date


def year_fraction(as_of: date, expiry: date) -> float:
    if expiry <= as_of:
        return 0.0
    return (expiry - as_of).days / 365.0
