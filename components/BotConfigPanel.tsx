import React from 'react';
import { BotConfig } from '../types';
import { SUPPORTED_PAIRS } from '../constants';
import { Settings, Play, Square, Activity, ShieldAlert, Cpu, Zap } from 'lucide-react';

interface BotConfigPanelProps {
  config: BotConfig;
  setConfig: React.Dispatch<React.SetStateAction<BotConfig>>;
  onToggle: () => void;
}

const BotConfigPanel: React.FC<BotConfigPanelProps> = ({ config, setConfig, onToggle }) => {
  
  const handleChange = (field: keyof BotConfig, value: string | number) => {
    setConfig(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 shadow-xl h-full">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold flex items-center gap-2 text-white">
          <Settings className="w-5 h-5 text-accent-500" />
          Bot Configuration
        </h2>
        <div className={`px-3 py-1 rounded-full text-xs font-mono font-bold ${config.isActive ? 'bg-green-900 text-green-400 border border-green-700' : 'bg-red-900 text-red-400 border border-red-700'}`}>
          {config.isActive ? 'RUNNING' : 'STOPPED'}
        </div>
      </div>

      <div className="space-y-5">
        
        {/* Symbol & Strategy */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs text-gray-400 mb-1">Asset Pair</label>
            <select 
              value={config.symbol}
              onChange={(e) => handleChange('symbol', e.target.value)}
              className="w-full bg-gray-950 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:ring-2 focus:ring-accent-500 outline-none appearance-none font-mono"
            >
              {SUPPORTED_PAIRS.map(pair => (
                <option key={pair} value={pair}>{pair}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">Strategy</label>
            <select 
              value={config.strategy}
              onChange={(e) => handleChange('strategy', e.target.value as any)}
              className="w-full bg-gray-950 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:ring-2 focus:ring-accent-500 outline-none appearance-none"
            >
              <option value="SCALPING">⚡ SCALPING (High Freq)</option>
              <option value="AI_ADAPTIVE">🤖 AI Adaptive (Gemini)</option>
              <option value="RSI_MACD">📊 RSI + MACD</option>
              <option value="MA_CROSS">📈 MA Crossover</option>
            </select>
          </div>
        </div>

        {/* Scalping Specific Badge */}
        {config.strategy === 'SCALPING' && (
            <div className="bg-blue-900/20 border border-blue-800/50 rounded-lg p-3 flex items-start gap-2">
                <Zap className="w-4 h-4 text-yellow-400 mt-0.5" />
                <div>
                    <p className="text-xs font-bold text-blue-200">Scalping Mode Active</p>
                    <p className="text-[10px] text-gray-400">Targeting quick profits using Bollinger breakouts & Stochastic.</p>
                </div>
            </div>
        )}

        {/* Risk Management */}
        <div className="border-t border-gray-800 pt-4">
          <div className="flex items-center gap-2 mb-3">
             <ShieldAlert className="w-4 h-4 text-orange-500" />
             <span className="text-sm font-semibold text-gray-300">Risk Management</span>
          </div>
          
          <div className="grid grid-cols-3 gap-3">
             <div>
                <label className="block text-xs text-gray-500 mb-1">Lot Size</label>
                <input 
                  type="number" 
                  step="0.01"
                  value={config.lotSize}
                  onChange={(e) => handleChange('lotSize', parseFloat(e.target.value))}
                  className="w-full bg-gray-950 border border-gray-700 rounded px-2 py-1.5 text-sm text-white"
                />
             </div>
             <div>
                <label className="block text-xs text-gray-500 mb-1">Stop Loss</label>
                <input 
                  type="number" 
                  value={config.stopLoss}
                  onChange={(e) => handleChange('stopLoss', parseInt(e.target.value))}
                  className="w-full bg-gray-950 border border-gray-700 rounded px-2 py-1.5 text-sm text-white"
                />
             </div>
             <div>
                <label className="block text-xs text-gray-500 mb-1">Take Profit</label>
                <input 
                  type="number" 
                  value={config.takeProfit}
                  onChange={(e) => handleChange('takeProfit', parseInt(e.target.value))}
                  className="w-full bg-gray-950 border border-gray-700 rounded px-2 py-1.5 text-sm text-white"
                />
             </div>
          </div>
        </div>

        {/* AI Settings */}
        <div className="border-t border-gray-800 pt-4">
             <div className="flex items-center gap-2 mb-3">
             <Cpu className="w-4 h-4 text-purple-500" />
             <span className="text-sm font-semibold text-gray-300">AI Parameters</span>
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">Risk Appetite</label>
            <div className="grid grid-cols-3 gap-2">
                {(['LOW', 'MEDIUM', 'HIGH'] as const).map((level) => (
                    <button
                        key={level}
                        onClick={() => handleChange('riskLevel', level)}
                        className={`text-xs py-1.5 rounded border transition-colors ${
                            config.riskLevel === level 
                            ? 'bg-purple-900/50 border-purple-500 text-purple-200' 
                            : 'bg-gray-950 border-gray-800 text-gray-500 hover:border-gray-600'
                        }`}
                    >
                        {level}
                    </button>
                ))}
            </div>
          </div>
        </div>

        {/* Action Button */}
        <button
          onClick={onToggle}
          className={`w-full mt-4 py-3 rounded-lg font-bold flex items-center justify-center gap-2 transition-all ${
            config.isActive 
              ? 'bg-red-600 hover:bg-red-700 text-white shadow-[0_0_15px_rgba(239,68,68,0.5)]' 
              : 'bg-green-600 hover:bg-green-700 text-white shadow-[0_0_15px_rgba(16,185,129,0.5)]'
          }`}
        >
          {config.isActive ? <Square className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current" />}
          {config.isActive ? 'STOP AUTO TRADING' : 'START AUTO TRADING'}
        </button>

      </div>
    </div>
  );
};

export default BotConfigPanel;
