import React from 'react';
import { IndicatorStats } from '../types';
import { Activity, ArrowUp, ArrowDown, Minus } from 'lucide-react';

interface Props {
  stats: IndicatorStats | null;
}

const IndicatorCard = ({ name, value, signal, color }: { name: string, value: string, signal: 'BUY' | 'SELL' | 'NEUTRAL', color: string }) => (
  <div className="bg-gray-800/50 border border-gray-700 p-3 rounded-lg flex flex-col justify-between">
    <div className="flex justify-between items-start mb-2">
      <span className="text-xs font-bold text-gray-400 uppercase">{name}</span>
      {signal === 'BUY' && <ArrowUp className="w-4 h-4 text-green-500" />}
      {signal === 'SELL' && <ArrowDown className="w-4 h-4 text-red-500" />}
      {signal === 'NEUTRAL' && <Minus className="w-4 h-4 text-gray-500" />}
    </div>
    <div className="flex items-end justify-between">
        <span className={`text-lg font-mono font-bold ${color}`}>{value}</span>
        <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${
            signal === 'BUY' ? 'bg-green-900/40 text-green-400' : 
            signal === 'SELL' ? 'bg-red-900/40 text-red-400' : 'bg-gray-700/40 text-gray-400'
        }`}>
            {signal}
        </span>
    </div>
  </div>
);

const TechIndicators: React.FC<Props> = ({ stats }) => {
  if (!stats) return <div className="h-24 bg-gray-900 rounded-xl animate-pulse"></div>;

  // Determine signals based on simplified logic
  const getRsiSignal = (v: number) => v > 70 ? 'SELL' : v < 30 ? 'BUY' : 'NEUTRAL';
  const getMacdSignal = (hist: number) => hist > 0 ? 'BUY' : 'SELL';
  const getStochSignal = (k: number) => k > 80 ? 'SELL' : k < 20 ? 'BUY' : 'NEUTRAL';

  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
      <IndicatorCard 
        name="RSI (14)" 
        value={stats.rsi.toFixed(1)} 
        signal={getRsiSignal(stats.rsi)}
        color="text-white"
      />
      <IndicatorCard 
        name="MACD" 
        value={stats.macd.histogram.toFixed(5)} 
        signal={getMacdSignal(stats.macd.histogram)}
        color={stats.macd.histogram > 0 ? 'text-green-400' : 'text-red-400'}
      />
      <IndicatorCard 
        name="Stochastic" 
        value={stats.stochastic.k.toFixed(1)} 
        signal={getStochSignal(stats.stochastic.k)}
        color="text-purple-400"
      />
       <IndicatorCard 
        name="EMA (20)" 
        value={stats.ema.toFixed(4)} 
        signal="NEUTRAL" 
        color="text-blue-400"
      />
      <IndicatorCard 
        name="Bollinger" 
        value="BAND" 
        signal="NEUTRAL" 
        color="text-orange-400"
      />
    </div>
  );
};

export default TechIndicators;
