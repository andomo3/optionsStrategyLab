export type Strategy = {
  id: number;
  name: string;
  owner?: number | null;
  created_at: string;
};

export type StrategyLeg = {
  id: number;
  strategy: number;
  right: "call" | "put";
  strike: string | null;
  expiry: string | null;
  quantity: number;
  created_at: string;
};
