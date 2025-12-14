import React from 'react';
import { Trade, TradeType } from '../types';
import { TrendingUp, TrendingDown, Clock, DollarSign } from 'lucide-react';

interface TradeLogProps {
  trades: Trade[];
}

const TradeLog: React.FC<TradeLogProps> = ({ trades }) => {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl shadow-xl overflow-hidden flex flex-col h-full">
      <div className="p-4 border-b border-gray-800 flex justify-between items-center bg-gray-900/50">
        <h3 className="font-bold text-white flex items-center gap-2">
            <Clock className="w-4 h-4 text-gray-400" />
            Trade History
        </h3>
        <span className="text-xs text-gray-500">{trades.length} Executed</span>
      </div>
      
      <div className="flex-1 overflow-y-auto p-0">
        <table className="w-full text-left border-collapse">
            <thead className="bg-gray-950 sticky top-0 z-10">
                <tr>
                    <th className="p-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                    <th className="p-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                    <th className="p-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Lot</th>
                    <th className="p-3 text-xs font-medium text-gray-500 uppercase tracking-wider text-right">Profit</th>
                </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
                {trades.length === 0 ? (
                    <tr>
                        <td colSpan={4} className="p-8 text-center text-gray-600 text-sm">
                            No trades executed yet.
                            <br/>
                            <span className="text-xs text-gray-700">Start the bot to simulate activity.</span>
                        </td>
                    </tr>
                ) : (
                    trades.slice().reverse().map((trade) => (
                        <tr key={trade.id} className="hover:bg-gray-800/30 transition-colors">
                            <td className="p-3">
                                <div className="flex items-center gap-2">
                                    {trade.type === TradeType.BUY ? (
                                        <div className="p-1 rounded bg-green-900/30 text-green-400">
                                            <TrendingUp size={14} />
                                        </div>
                                    ) : (
                                        <div className="p-1 rounded bg-red-900/30 text-red-400">
                                            <TrendingDown size={14} />
                                        </div>
                                    )}
                                    <span className={`text-xs font-bold ${trade.type === TradeType.BUY ? 'text-green-400' : 'text-red-400'}`}>
                                        {trade.type}
                                    </span>
                                </div>
                            </td>
                            <td className="p-3 text-xs font-mono text-gray-300">
                                {trade.entryPrice.toFixed(5)}
                            </td>
                            <td className="p-3 text-xs font-mono text-gray-400">
                                {trade.lotSize.toFixed(2)}
                            </td>
                            <td className="p-3 text-right">
                                <span className={`text-xs font-mono font-bold flex items-center justify-end gap-1 ${trade.profit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                    {trade.profit >= 0 ? '+' : ''}{trade.profit.toFixed(2)}
                                    <DollarSign size={10} />
                                </span>
                            </td>
                        </tr>
                    ))
                )}
            </tbody>
        </table>
      </div>
    </div>
  );
};

export default TradeLog;
