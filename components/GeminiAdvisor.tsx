import React, { useState, useEffect } from 'react';
import { BotConfig, Candle, AIAnalysisResult, IndicatorStats } from '../types';
import { analyzeMarket, generateStrategyCode, fixStrategyCode } from '../services/gemini';
import { Sparkles, Brain, Code, FileText, Loader2, MessageSquare, Wrench, Play, Copy, Check } from 'lucide-react';

interface GeminiAdvisorProps {
  candles: Candle[];
  config: BotConfig;
  indicators: IndicatorStats | null;
}

const GeminiAdvisor: React.FC<GeminiAdvisorProps> = ({ candles, config, indicators }) => {
  const [analysis, setAnalysis] = useState<AIAnalysisResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'ANALYSIS' | 'CODE'>('ANALYSIS');
  
  // Code Editor State
  const [editorContent, setEditorContent] = useState<string>('');
  const [errorInput, setErrorInput] = useState<string>('');
  const [codeLoading, setCodeLoading] = useState(false);
  const [fixLoading, setFixLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  // Auto-generate initial placeholder or code when entering tab for first time?
  // Let's keep it manual to save tokens, but maybe show a placeholder.

  const handleAnalysis = async () => {
    if (!indicators) return;
    setLoading(true);
    const result = await analyzeMarket(candles, config, indicators);
    setAnalysis(result);
    setLoading(false);
  };

  const handleGenerateCode = async () => {
      setCodeLoading(true);
      const desc = `Create a ${config.strategy} EA for ${config.symbol}. Include RSI, MACD, Bollinger Bands, EMA, and Stochastic. Risk: ${config.riskLevel}. StopLoss: ${config.stopLoss}, TakeProfit: ${config.takeProfit}.`;
      const code = await generateStrategyCode(desc);
      // Remove markdown code blocks if present (basic cleanup)
      const cleanCode = code.replace(/```mql5/g, '').replace(/```/g, '');
      setEditorContent(cleanCode);
      setCodeLoading(false);
  }

  const handleFixCode = async () => {
      if (!editorContent || !errorInput) return;
      setFixLoading(true);
      const fixedCode = await fixStrategyCode(editorContent, errorInput);
      const cleanCode = fixedCode.replace(/```mql5/g, '').replace(/```/g, '');
      setEditorContent(cleanCode);
      setErrorInput(''); // Clear error input after fix
      setFixLoading(false);
  }

  const handleCopy = () => {
      navigator.clipboard.writeText(editorContent);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl shadow-xl flex flex-col h-full overflow-hidden">
        {/* Header Tabs */}
        <div className="flex border-b border-gray-800 bg-gray-950">
            <button 
                onClick={() => setActiveTab('ANALYSIS')}
                className={`flex-1 p-3 text-sm font-medium flex items-center justify-center gap-2 transition-colors ${activeTab === 'ANALYSIS' ? 'bg-gray-900 text-accent-400 border-b-2 border-accent-500' : 'text-gray-500 hover:text-gray-300 hover:bg-gray-900/50'}`}
            >
                <Brain className="w-4 h-4" />
                Market AI
            </button>
            <button 
                onClick={() => setActiveTab('CODE')}
                className={`flex-1 p-3 text-sm font-medium flex items-center justify-center gap-2 transition-colors ${activeTab === 'CODE' ? 'bg-gray-900 text-purple-400 border-b-2 border-purple-500' : 'text-gray-500 hover:text-gray-300 hover:bg-gray-900/50'}`}
            >
                <Code className="w-4 h-4" />
                Code Editor
            </button>
        </div>

      {activeTab === 'ANALYSIS' && (
      <div className="p-6 flex flex-col h-full bg-gray-900">
        {!analysis ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center space-y-4 opacity-50">
             <div className="p-4 bg-gray-800 rounded-full animate-pulse">
                <Sparkles className="w-8 h-8 text-accent-500" />
             </div>
             <div>
                <h3 className="text-white font-medium">AI Strategy Advisor</h3>
                <p className="text-sm text-gray-500 max-w-xs mt-1">Analyze market using 5-Factor Confluence (RSI, MACD, EMA, BB, Stoch).</p>
             </div>
          </div>
        ) : (
          <div className="space-y-4 animate-fade-in">
             <div className="flex items-center justify-between">
                <h3 className="text-gray-400 text-xs font-bold uppercase tracking-widest">Sentiment</h3>
                <span className={`px-2 py-0.5 rounded text-xs font-bold ${
                    analysis.sentiment === 'BULLISH' ? 'bg-green-900 text-green-400' :
                    analysis.sentiment === 'BEARISH' ? 'bg-red-900 text-red-400' : 'bg-gray-700 text-gray-300'
                }`}>
                    {analysis.sentiment} ({analysis.confidence}%)
                </span>
             </div>
             
             <div className="bg-gray-950 p-4 rounded-lg border border-gray-800">
                <div className="flex items-start gap-3">
                    <MessageSquare className="w-5 h-5 text-accent-500 mt-0.5 shrink-0" />
                    <div>
                        <p className="text-white text-sm font-medium leading-relaxed">{analysis.recommendation}</p>
                        <p className="text-gray-500 text-xs mt-2 leading-relaxed border-t border-gray-800 pt-2">{analysis.reasoning}</p>
                    </div>
                </div>
             </div>
          </div>
        )}

        <div className="mt-auto pt-4">
            <button
            onClick={handleAnalysis}
            disabled={loading || !indicators}
            className="w-full bg-accent-600 hover:bg-accent-700 disabled:opacity-50 disabled:cursor-not-allowed text-white py-3 rounded-lg font-bold flex items-center justify-center gap-2 transition-all shadow-lg shadow-accent-600/20"
            >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            {loading ? 'Processing Indicators...' : 'Analyze with Gemini'}
            </button>
        </div>
      </div>
      )}

      {activeTab === 'CODE' && (
          <div className="flex flex-col h-full bg-gray-950 relative">
              {/* Toolbar */}
              <div className="flex items-center justify-between px-3 py-2 bg-gray-900 border-b border-gray-800">
                  <span className="text-xs font-mono text-gray-500">{config.symbol}_{config.strategy}.mq5</span>
                  <div className="flex items-center gap-2">
                      <button 
                        onClick={handleGenerateCode} 
                        disabled={codeLoading}
                        className="text-xs bg-purple-600 hover:bg-purple-700 text-white px-3 py-1.5 rounded flex items-center gap-1.5 disabled:opacity-50"
                      >
                         {codeLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Play className="w-3 h-3" />}
                         Generate New
                      </button>
                      <button 
                         onClick={handleCopy}
                         className="text-gray-400 hover:text-white p-1.5 rounded hover:bg-gray-800 transition-colors"
                         title="Copy Code"
                      >
                         {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                      </button>
                  </div>
              </div>

              {/* Editor Area */}
              <div className="flex-1 relative group">
                  {codeLoading || fixLoading ? (
                      <div className="absolute inset-0 bg-gray-950/80 backdrop-blur-sm z-10 flex flex-col items-center justify-center text-purple-400">
                          <Loader2 className="w-10 h-10 animate-spin mb-2" />
                          <p className="text-xs font-mono animate-pulse">{fixLoading ? 'AI is fixing your code...' : 'Writing strategy code...'}</p>
                      </div>
                  ) : null}
                  
                  <textarea
                    value={editorContent}
                    onChange={(e) => setEditorContent(e.target.value)}
                    spellCheck={false}
                    placeholder="// MQL5 Code will appear here..."
                    className="w-full h-full bg-gray-950 text-gray-300 font-mono text-xs p-4 resize-none outline-none focus:bg-gray-950/50"
                    style={{ lineHeight: '1.5' }}
                  />
              </div>

              {/* Error Fixer / Debugger Panel */}
              <div className="border-t border-gray-800 bg-gray-900 p-3">
                  <div className="flex items-start gap-2">
                     <Wrench className="w-4 h-4 text-orange-500 mt-2.5 shrink-0" />
                     <div className="flex-1">
                         <p className="text-[10px] text-gray-500 uppercase font-bold mb-1">AI Debugger & Refactor</p>
                         <div className="flex gap-2">
                             <input 
                                type="text" 
                                value={errorInput}
                                onChange={(e) => setErrorInput(e.target.value)}
                                placeholder="Paste compilation error or describe change (e.g., 'Fix undeclared identifier')"
                                className="flex-1 bg-gray-950 border border-gray-700 rounded px-3 py-2 text-xs text-white placeholder-gray-600 focus:border-purple-500 focus:outline-none"
                                onKeyDown={(e) => e.key === 'Enter' && handleFixCode()}
                             />
                             <button 
                                onClick={handleFixCode}
                                disabled={fixLoading || !editorContent || !errorInput}
                                className="bg-orange-600 hover:bg-orange-700 disabled:opacity-50 disabled:bg-gray-800 text-white px-4 py-2 rounded text-xs font-bold whitespace-nowrap"
                             >
                                 Fix Code
                             </button>
                         </div>
                     </div>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

export default GeminiAdvisor;
