export type PricingPreviewLeg = {
  leg_id: number;
  right: "call" | "put";
  strike: number;
  expiry: string;
  quantity: number;
  iv: number;
  price: number;
  greeks: {
    delta: number;
    gamma: number;
    vega: number;
    theta: number;
  };
};

export type PricingPreviewResponse = {
  assumptions: {
    spot: number;
    r: number;
    q: number;
    as_of: string;
  };
  strategy: {
    id: number;
    name: string;
  };
  per_leg: PricingPreviewLeg[];
  totals: {
    price: number;
    greeks: {
      delta: number;
      gamma: number;
      vega: number;
      theta: number;
    };
  };
  cached: boolean;
};

export type PayoffGridResponse = {
  assumptions: {
    spot: number;
    spot_min_mult: number;
    spot_max_mult: number;
    num_points: number;
  };
  strategy: {
    id: number;
    name: string;
  };
  grid: number[];
  pnl: number[];
  breakevens: number[];
  max_profit: number | null;
  max_loss: number | null;
  cached: boolean;
};
