export const DEFAULT_SYMBOL = "EURUSD";

export const SUPPORTED_PAIRS = [
  "EURUSD",
  "GBPUSD", 
  "USDJPY",
  "XAUUSD", // Gold
  "BTCUSD", // Bitcoin
  "ETHUSD", // Ethereum
  "AUDUSD",
  "USDCAD"
];

// Map initial prices so simulation looks real when switching
export const PAIR_PRICES: Record<string, number> = {
  "EURUSD": 1.0850,
  "GBPUSD": 1.2650,
  "USDJPY": 150.20,
  "XAUUSD": 2350.50,
  "BTCUSD": 64000.00,
  "ETHUSD": 3400.00,
  "AUDUSD": 0.6550,
  "USDCAD": 1.3550
};

export const INITIAL_CONFIG = {
  symbol: DEFAULT_SYMBOL,
  lotSize: 0.1,
  stopLoss: 50,
  takeProfit: 100,
  strategy: 'SCALPING', // Defaulting to the new request
  riskLevel: 'HIGH',
  isActive: false,
} as const;

export const GEMINI_MODEL = "gemini-2.5-flash";
