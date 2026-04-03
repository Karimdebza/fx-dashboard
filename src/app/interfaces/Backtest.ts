export interface BacktestDetail {
  date: string;
  actual: number;
  predicted: number;
  error: number;
}

export interface BacktestResult {
  mae: number;
  mape: number;
  details: BacktestDetail[];
}