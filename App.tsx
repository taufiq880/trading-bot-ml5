import React, { useState, useEffect, useRef } from 'react';
import { BotConfig, Candle, Trade, TradeType, AIAnalysisResult, IndicatorStats } from './types';
import { INITIAL_CONFIG, PAIR_PRICES } from './constants';
import MarketChart from './components/MarketChart';
import BotConfigPanel from './components/BotConfigPanel';
import TradeLog from './components/TradeLog';
import GeminiAdvisor from './components/GeminiAdvisor';
import TechIndicators from './components/TechIndicators';
import { calculateAllIndicators } from './services/indicators';
import { Activity, Wifi } from 'lucide-react';

// Box-Muller transform for normal distribution (Bell curve noise)
const randn_bm = () => {
    let u = 0, v = 0;
    while(u === 0) u = Math.random();
    while(v === 0) v = Math.random();
    return Math.sqrt( -2.0 * Math.log( u ) ) * Math.cos( 2.0 * Math.PI * v );
}

const App: React.FC = () => {
  const [config, setConfig] = useState<BotConfig>(INITIAL_CONFIG);
  const [candles, setCandles] = useState<Candle[]>([]);
  const [trades, setTrades] = useState<Trade[]>([]);
  const [lastPrice, setLastPrice] = useState(PAIR_PRICES[INITIAL_CONFIG.symbol]);
  const [indicators, setIndicators] = useState<IndicatorStats | null>(null);
  
  // Simulation State Refs (Persist without re-render)
  const intervalRef = useRef<number | null>(null);
  const trendRef = useRef<number>(0); // Current market trend direction
  const volatilityRef = useRef<number>(0.0001); // Current market volatility

  // Initialize/Reset Data when Symbol changes
  useEffect(() => {
    const initialData: Candle[] = [];
    let currentPrice = PAIR_PRICES[config.symbol] || 1.0000;
    
    // Generate realistic historical data
    let currentTime = Date.now() - (300 * 60 * 1000); 
    let tempTrend = 0;

    // Generate more history for zoom/pan (300 candles)
    for (let i = 0; i < 300; i++) {
      // Slowly change trend
      tempTrend = tempTrend * 0.9 + (Math.random() - 0.5) * 0.002;
      
      const open = currentPrice;
      // Random walk with drift
      const change = currentPrice * (tempTrend + (randn_bm() * 0.0005));
      const close = currentPrice + change;
      
      const high = Math.max(open, close) + (Math.random() * Math.abs(change) * 0.5);
      const low = Math.min(open, close) - (Math.random() * Math.abs(change) * 0.5);
      const volume = Math.floor(Math.random() * 500) + 50;

      initialData.push({
        time: new Date(currentTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        open, high, low, close, volume
      });
      
      currentPrice = close;
      currentTime += 60 * 1000;
    }
    setCandles(initialData);
    setLastPrice(currentPrice);
    
    // Reset simulation params
    trendRef.current = 0;
    volatilityRef.current = 0.0001;

  }, [config.symbol]);

  // LIVE MARKET SIMULATION ENGINE
  useEffect(() => {
    intervalRef.current = window.setInterval(() => {
      setLastPrice(prevPrice => {
        // 1. Update Market Conditions (Dynamic Volatility & Trend)
        // Trend persistence: Trend tends to stay same but drifts
        trendRef.current = trendRef.current * 0.98 + (randn_bm() * 0.00002);
        
        // Volatility clustering: Volatility tends to spike and settle
        volatilityRef.current = Math.max(0.00005, volatilityRef.current * 0.99 + (Math.random() * 0.00001));
        if (Math.random() > 0.98) volatilityRef.current *= 2; // Occasional volatility spike (News event)

        // 2. Calculate Tick
        const drift = trendRef.current;
        const diffusion = volatilityRef.current * randn_bm();
        const change = prevPrice * (drift + diffusion);
        const newPrice = prevPrice + change;
        
        // 3. Update Candles Real-time
        setCandles(prevCandles => {
          const now = new Date();
          const timeString = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
          
          let newData = [...prevCandles];
          const lastCandle = newData[newData.length - 1];

          // Check if we need a new candle (simulate 1-minute candles)
          // For demo speed, we create a new candle every 10 ticks (approx 5 sec) to make chart move faster
          const shouldCloseCandle = Math.random() > 0.9; // Random candle close for "Live" feel variation

          if (shouldCloseCandle || lastCandle.time !== timeString) {
             // New Candle
             const newCandle: Candle = {
                time: timeString,
                open: newPrice,
                close: newPrice,
                high: newPrice,
                low: newPrice,
                volume: 1
             };
             newData.push(newCandle);
             // Keep more history for scrolling
             if (newData.length > 500) newData.shift();
          } else {
             // Update Current Candle
             newData[newData.length - 1] = {
                ...lastCandle,
                close: newPrice,
                high: Math.max(lastCandle.high, newPrice),
                low: Math.min(lastCandle.low, newPrice),
                volume: lastCandle.volume + 1
             };
          }
          
          // Recalculate indicators on every tick for "Live" signals
          const newIndicators = calculateAllIndicators(newData);
          setIndicators(newIndicators);
          
          return newData;
        });

        return newPrice;
      });

    }, 500); // 500ms Tick Rate (High Frequency)

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  // Bot Logic Execution
  useEffect(() => {
    if (!config.isActive || !indicators) return;

    const executeBotLogic = () => {
      let signal = 0; // -2 to +2
      const { rsi, bollinger, stochastic } = indicators;

      // Logic Adaptation based on Strategy
      if (config.strategy === 'SCALPING') {
          // Aggressive Scalping
          if (rsi < 25 && lastPrice < bollinger.lower) signal = 2; // Strong Buy
          else if (rsi > 75 && lastPrice > bollinger.upper) signal = -2; // Strong Sell
      } 
      else {
          // Standard Trend
          if (rsi < 30) signal = 1;
          if (rsi > 70) signal = -1;
      }

      // Random execution chance (simulate order filling)
      if (signal !== 0 && Math.random() > 0.5) {
        const type = signal > 0 ? TradeType.BUY : TradeType.SELL;
        const profitPips = (Math.random() - 0.45) * 10; // Scalping makes small pips
        const profitValue = profitPips * config.lotSize * 10;

        const newTrade: Trade = {
          id: Math.random().toString(36).substr(2, 9),
          symbol: config.symbol,
          type,
          entryPrice: lastPrice,
          lotSize: config.lotSize,
          profit: profitValue, 
          status: 'CLOSED',
          timestamp: Date.now()
        };

        setTrades(prev => [newTrade, ...prev]);
      }
    };

    const botInterval = setInterval(executeBotLogic, 1000); // Check every second
    return () => clearInterval(botInterval);
  }, [config.isActive, lastPrice, config.strategy, indicators]);


  const toggleBot = () => {
    setConfig(prev => ({ ...prev, isActive: !prev.isActive }));
  };

  return (
    <div className="min-h-screen bg-gray-950 text-gray-200 font-sans p-4 md:p-6 flex flex-col">
      {/* Header */}
      <header className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-3">
            <div className="bg-accent-600 p-2 rounded-lg shadow-lg shadow-accent-500/20">
                <Activity className="w-6 h-6 text-white animate-pulse" />
            </div>
            <div>
                <h1 className="text-2xl font-bold text-white tracking-tight">QuantFlow</h1>
                <div className="flex items-center gap-2">
                    <p className="text-xs text-gray-500 uppercase tracking-widest font-semibold">MT5 AI Strategy Dashboard</p>
                    <span className="px-1.5 py-0.5 rounded bg-blue-900/50 text-blue-400 text-[10px] font-bold border border-blue-800">LIVE</span>
                </div>
            </div>
        </div>
        <div className="flex items-center gap-6">
             {/* Connection Status */}
             <div className="flex items-center gap-2">
                 <Wifi className="w-4 h-4 text-green-500" />
                 <div className="text-right">
                    <p className="text-[10px] text-gray-400 font-mono">LATENCY</p>
                    <p className="text-xs font-bold text-green-400 font-mono">12ms</p>
                 </div>
             </div>
             
             <div className="text-right hidden sm:block pl-6 border-l border-gray-800">
                 <p className="text-xs text-gray-500">Account Balance</p>
                 <p className="text-lg font-mono font-bold text-white">$10,450.00</p>
             </div>
        </div>
      </header>

      {/* Main Grid */}
      <main className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-0">
        
        {/* Left Column: Chart & Indicators (Span 8) */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          <div className="h-[450px]">
            <MarketChart data={candles} indicators={indicators} />
          </div>
          <div>
            <TechIndicators stats={indicators} />
          </div>
          <div className="flex-1 min-h-[200px]">
             <TradeLog trades={trades} />
          </div>
        </div>

        {/* Right Column: Controls & AI (Span 4) */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          <div className="flex-none">
            <BotConfigPanel config={config} setConfig={setConfig} onToggle={toggleBot} />
          </div>
          <div className="flex-1 min-h-[300px]">
             <GeminiAdvisor candles={candles} config={config} indicators={indicators} />
          </div>
        </div>

      </main>
    </div>
  );
};

export default App;