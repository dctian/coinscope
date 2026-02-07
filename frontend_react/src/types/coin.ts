/** A single identified coin from the backend. */
export interface Coin {
  id: string;
  name: string;
  country: string;
  year: number | null;
  denomination: string;
  face_value: number | null;
  currency: string;
  obverse_description: string | null;
  reverse_description: string | null;
  confidence: number;
  bbox?: number[] | null;
}

/** Response from the POST /api/v1/coins/identify endpoint. */
export interface CoinIdentificationResponse {
  coins: Coin[];
  total_coins_detected: number;
  model_used: string;
}

/** Response from GET / root endpoint. */
export interface AppInfo {
  name: string;
  version: string;
  description: string;
  docs: string;
  health: string;
}

/** Response from GET /api/v1/coins/health endpoint. */
export interface HealthResponse {
  status: string;
  model: string;
}

/** Data passed via React Router location state from Home to Results. */
export interface ResultsLocationState {
  coins: Coin[];
  totalCoinsDetected: number;
  modelUsed: string;
  imageUrl: string;
}
