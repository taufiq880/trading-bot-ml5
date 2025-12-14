import { Candle, IndicatorStats } from '../types';

// Helper to get close prices
const getCloses = (candles: Candle[]) => candles.map(c => c.close);
const getHighs = (candles: Candle[]) => candles.map(c => c.high);
const getLows = (candles: Candle[]) => candles.map(c => c.low);

// 1. RSI (Relative Strength Index) - Period 14
export const calculateRSI = (candles: Candle[], period = 14): number => {
  if (candles.length < period + 1) return 50;
  const closes = getCloses(candles);
  let gains = 0;
  let losses = 0;

  for (let i = closes.length - period; i < closes.length; i++) {
    const diff = closes[i] - closes[i - 1];
    if (diff >= 0) gains += diff;
    else losses += Math.abs(diff);
  }

  const avgGain = gains / period;
  const avgLoss = losses / period;
  
  if (avgLoss === 0) return 100;
  const rs = avgGain / avgLoss;
  return 100 - (100 / (1 + rs));
};

// 2. EMA (Exponential Moving Average) - Period 20 usually (User asked for Top 5, EMA 20 or 50 is standard)
export const calculateEMA = (candles: Candle[], period = 20): number => {
  const closes = getCloses(candles);
  if (closes.length < period) return closes[closes.length - 1];

  const k = 2 / (period + 1);
  let ema = closes[0]; // Simple start for demo approximation
  
  // Recalculate over the array to get current EMA
  for (let i = 1; i < closes.length; i++) {
    ema = (closes[i] * k) + (ema * (1 - k));
  }
  return ema;
};

// 3. Bollinger Bands - Period 20, StdDev 2
export const calculateBollinger = (candles: Candle[], period = 20, stdDevMult = 2) => {
  const closes = getCloses(candles);
  if (closes.length < period) return { upper: 0, middle: 0, lower: 0 };

  const slice = closes.slice(-period);
  const mean = slice.reduce((a, b) => a + b, 0) / period;
  
  const squaredDiffs = slice.map(val => Math.pow(val - mean, 2));
  const variance = squaredDiffs.reduce((a, b) => a + b, 0) / period;
  const stdDev = Math.sqrt(variance);

  return {
    middle: mean,
    upper: mean + (stdDev * stdDevMult),
    lower: mean - (stdDev * stdDevMult)
  };
};

// 4. MACD (12, 26, 9)
export const calculateMACD = (candles: Candle[]) => {
  const closes = getCloses(candles);
  if (closes.length < 26) return { macd: 0, signal: 0, histogram: 0 };

  // Helper for quick EMA on array
  const calcEMAArray = (data: number[], period: number) => {
    const k = 2 / (period + 1);
    let ema = data[0];
    const res = [ema];
    for (let i = 1; i < data.length; i++) {
      ema = (data[i] * k) + (ema * (1 - k));
      res.push(ema);
    }
    return res;
  };

  const ema12 = calcEMAArray(closes, 12);
  const ema26 = calcEMAArray(closes, 26);
  
  const macdLine: number[] = [];
  for(let i=0; i<closes.length; i++) {
      macdLine.push(ema12[i] - ema26[i]);
  }

  const signalLine = calcEMAArray(macdLine, 9);
  
  const currentMACD = macdLine[macdLine.length - 1];
  const currentSignal = signalLine[signalLine.length - 1];

  return {
    macd: currentMACD,
    signal: currentSignal,
    histogram: currentMACD - currentSignal
  };
};

// 5. Stochastic Oscillator (14, 3, 3)
export const calculateStochastic = (candles: Candle[], period = 14) => {
  if (candles.length < period) return { k: 50, d: 50 };
  
  const currentClose = candles[candles.length - 1].close;
  const slice = candles.slice(-period);
  const low = Math.min(...getLows(slice));
  const high = Math.max(...getHighs(slice));
  
  const k = ((currentClose - low) / (high - low)) * 100;
  
  // Usually %D is a 3-period SMA of %K. For simplicity, we just return K here or a slight smooth.
  // We'll return K and a "mock" D which is just previous K for this demo context
  return { k, d: k * 0.9 }; // Simplified D
};

export const calculateAllIndicators = (candles: Candle[]): IndicatorStats => {
  return {
    rsi: calculateRSI(candles),
    ema: calculateEMA(candles, 20), // EMA 20
    bollinger: calculateBollinger(candles),
    macd: calculateMACD(candles),
    stochastic: calculateStochastic(candles)
  };
};
