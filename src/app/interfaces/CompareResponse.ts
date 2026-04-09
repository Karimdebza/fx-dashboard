import { FxResponse } from './FxResponse';
export interface CompareResponse {
  [devise: string]: FxResponse;
}