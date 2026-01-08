from risk.services.metrics import summarize_distribution


def test_metrics_summary_basic():
    pnl = [-1.0, 0.0, 1.0]
    summary = summarize_distribution(pnl, var_level=0.05, bins=3)
    assert summary["expected_pl"] == 0.0
    assert summary["pop"] == 1 / 3
    assert summary["var"] <= 0.0
    assert "histogram" in summary
    assert len(summary["histogram"]["counts"]) == 3
