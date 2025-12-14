export interface Candle {
  time: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export enum TradeType {
  BUY = 'BUY',
  SELL = 'SELL'
}

export interface Trade {
  id: string;
  symbol: string;
  type: TradeType;
  entryPrice: number;
  exitPrice?: number;
  lotSize: number;
  profit: number;
  status: 'OPEN' | 'CLOSED';
  timestamp: number;
}

export interface BotConfig {
  symbol: string;
  lotSize: number;
  stopLoss: number; // in pips
  takeProfit: number; // in pips
  strategy: 'SCALPING' | 'RSI_MACD' | 'MA_CROSS' | 'AI_ADAPTIVE';
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  isActive: boolean;
}

export interface IndicatorStats {
  rsi: number;
  macd: { macd: number; signal: number; histogram: number };
  bollinger: { upper: number; middle: number; lower: number };
  ema: number; // EMA 20 or 50
  stochastic: { k: number; d: number };
}

export interface AIAnalysisResult {
  sentiment: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
  confidence: number;
  recommendation: string;
  reasoning: string;
}
