export type RiskRunSummary = {
  expected_pl: number;
  pop: number;
  var: number;
  cvar: number;
  histogram: {
    bins: number[];
    counts: number[];
  };
  inputs?: Record<string, unknown>;
};

export type RiskRun = {
  id: number;
  status: "PENDING" | "RUNNING" | "SUCCEEDED" | "FAILED";
  params: Record<string, unknown>;
  summary?: RiskRunSummary | null;
  error_message?: string;
};
