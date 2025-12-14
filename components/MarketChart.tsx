import React, { useState, useRef, useMemo } from 'react';
import { Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Line, ComposedChart } from 'recharts';
import { Candle, IndicatorStats } from '../types';
import { RotateCcw, ZoomIn, ZoomOut, Move } from 'lucide-react';

interface MarketChartProps {
  data: Candle[];
  indicators: IndicatorStats | null;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const price = payload.find((p: any) => p.dataKey === 'close');
    const ema = payload.find((p: any) => p.dataKey === 'ema');
    
    return (
      <div className="bg-gray-900/95 border border-gray-700 p-3 rounded shadow-2xl text-xs z-50 backdrop-blur-sm">
        <p className="text-gray-400 mb-2 font-mono">{label}</p>
        {price && (
            <div className="flex justify-between gap-4 mb-1">
                <span className="text-gray-300">Price:</span>
                <span className="text-white font-mono font-bold">{price.value.toFixed(5)}</span>
            </div>
        )}
        {ema && (
            <div className="flex justify-between gap-4">
                <span className="text-blue-400">EMA(20):</span>
                <span className="text-blue-400 font-mono">{ema.value.toFixed(5)}</span>
            </div>
        )}
      </div>
    );
  }
  return null;
};

const MarketChart: React.FC<MarketChartProps> = ({ data, indicators }) => {
  // Chart interaction state
  const [zoomLevel, setZoomLevel] = useState(60); // Number of candles visible
  const [panOffset, setPanOffset] = useState(0); // Offset from the right (0 = live view)
  const [isDragging, setIsDragging] = useState(false);
  
  const startX = useRef(0);
  
  // Calculate full chart data (memoized) to ensure indicators are consistent before slicing
  const fullChartData = useMemo(() => {
    return data.map((d, i, arr) => {
        const slice = arr.slice(Math.max(0, i - 19), i + 1);
        const sum = slice.reduce((a, b) => a + b.close, 0);
        const ema = sum / slice.length;
        
        return {
            ...d,
            ema,
            upper: ema + (ema * 0.0005), 
            lower: ema - (ema * 0.0005)
        };
    });
  }, [data]);

  // Derive visible data based on zoom and pan
  const visibleData = useMemo(() => {
    const total = fullChartData.length;
    const end = total - panOffset;
    const start = Math.max(0, end - zoomLevel);
    
    // Ensure we have at least some data
    if (end <= 0) return fullChartData.slice(0, Math.min(zoomLevel, total));
    
    return fullChartData.slice(start, end);
  }, [fullChartData, zoomLevel, panOffset]);

  // Determine chart scale based on visible data
  const { minPrice, maxPrice, currentPrice, prevPrice } = useMemo(() => {
    if (visibleData.length === 0) return { minPrice: 0, maxPrice: 1, currentPrice: 0, prevPrice: 0 };
    
    const lows = visibleData.map(d => d.low);
    const highs = visibleData.map(d => d.high);
    const min = Math.min(...lows) * 0.9998;
    const max = Math.max(...highs) * 1.0002;
    
    const curr = data[data.length - 1]?.close || 0;
    const prev = data[data.length - 2]?.close || curr;
    
    return { minPrice: min, maxPrice: max, currentPrice: curr, prevPrice: prev };
  }, [visibleData, data]);

  const isUp = currentPrice >= prevPrice;

  // Handlers
  const handleWheel = (e: React.WheelEvent) => {
      // Zoom logic
      if (Math.abs(e.deltaY) > 0) {
          const delta = Math.sign(e.deltaY);
          // Scroll down (positive) -> Zoom Out (increase range)
          // Scroll up (negative) -> Zoom In (decrease range)
          setZoomLevel(prev => {
              const step = Math.ceil(prev * 0.1);
              const next = prev + (delta * step);
              return Math.max(20, Math.min(data.length, next));
          });
      }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
      setIsDragging(true);
      startX.current = e.clientX;
  };

  const handleMouseMove = (e: React.MouseEvent) => {
      if (!isDragging) return;
      const dx = e.clientX - startX.current;
      
      // Sensitivity factor
      if (Math.abs(dx) > 5) {
          const shift = Math.round(dx / 5); // 1 candle per 5px
          setPanOffset(prev => {
              const next = prev + shift;
              // Limit panning: 
              // Min offset: 0 (right edge)
              // Max offset: data.length - zoomLevel (left edge)
              return Math.max(0, Math.min(data.length - zoomLevel, next));
          });
          startX.current = e.clientX;
      }
  };

  const handleMouseUp = () => setIsDragging(false);
  const handleMouseLeave = () => setIsDragging(false);

  const resetView = () => {
      setPanOffset(0);
      setZoomLevel(60);
  };

  return (
    <div 
        className={`h-full w-full bg-gray-900 border border-gray-800 rounded-xl p-1 shadow-xl relative overflow-hidden flex flex-col select-none ${isDragging ? 'cursor-grabbing' : 'cursor-default'}`}
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
    >
        {/* Live Ticker Header */}
        <div className="absolute top-4 left-4 z-20 pointer-events-none">
            <div className="flex items-center gap-3">
                 <div className={`text-4xl font-mono font-bold tracking-tighter ${isUp ? 'text-green-500' : 'text-red-500'}`}>
                    {currentPrice.toFixed(5)}
                 </div>
                 <div className="flex flex-col">
                     <span className={`text-xs font-bold px-1.5 py-0.5 rounded ${isUp ? 'bg-green-900/50 text-green-400' : 'bg-red-900/50 text-red-400'}`}>
                        {isUp ? '▲' : '▼'} {(currentPrice - prevPrice).toFixed(5)}
                     </span>
                 </div>
            </div>
        </div>

        {/* Controls Overlay */}
        <div className="absolute top-4 right-14 z-20 flex flex-col gap-2">
             <div className="flex flex-col bg-gray-800/80 backdrop-blur rounded-lg border border-gray-700 shadow-lg p-1">
                <button onClick={() => setZoomLevel(z => Math.max(20, z - 10))} className="p-1.5 hover:bg-gray-700 rounded text-gray-400 hover:text-white" title="Zoom In">
                    <ZoomIn size={16} />
                </button>
                <button onClick={() => setZoomLevel(z => Math.min(data.length, z + 10))} className="p-1.5 hover:bg-gray-700 rounded text-gray-400 hover:text-white" title="Zoom Out">
                    <ZoomOut size={16} />
                </button>
             </div>
             
             {panOffset > 0 && (
                 <button 
                    onClick={resetView}
                    className="flex items-center gap-1 bg-accent-600/90 hover:bg-accent-600 text-white text-[10px] font-bold py-1 px-2 rounded-lg shadow-lg animate-in fade-in zoom-in duration-200"
                 >
                    <RotateCcw size={12} />
                    RESET VIEW
                 </button>
             )}
        </div>

        {/* Pan Indicator Hint */}
        {isDragging && (
             <div className="absolute inset-0 z-30 flex items-center justify-center pointer-events-none bg-black/10">
                 <div className="bg-gray-900/80 text-white px-3 py-1 rounded-full text-xs font-bold border border-gray-700 flex items-center gap-2">
                     <Move size={12} /> Panning History
                 </div>
             </div>
        )}

      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart
          data={visibleData}
          margin={{ top: 60, right: 5, left: 0, bottom: 0 }}
        >
          <defs>
            <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.2}/>
              <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false} />
          <XAxis 
            dataKey="time" 
            tick={{ fill: '#4b5563', fontSize: 10 }} 
            axisLine={false} 
            tickLine={false}
            minTickGap={50}
          />
          <YAxis 
            domain={[minPrice, maxPrice]} 
            tick={{ fill: '#6B7280', fontSize: 11, fontFamily: 'JetBrains Mono' }} 
            axisLine={false} 
            tickLine={false} 
            orientation="right"
            tickFormatter={(value) => value.toFixed(5)}
            width={65}
            allowDataOverflow={true} // Important for zoomed views
          />
          <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#4b5563', strokeDasharray: '4 4' }} />
          
          {/* Bollinger Bands Visuals */}
          <Area type="monotone" dataKey="upper" stroke="none" fill="#f97316" fillOpacity={0.05} isAnimationActive={false} />
          <Area type="monotone" dataKey="lower" stroke="none" fill="none" isAnimationActive={false} />

          {/* Price Area */}
          <Area 
            type="monotone" 
            dataKey="close" 
            stroke="#3B82F6" 
            strokeWidth={2}
            fillOpacity={1} 
            fill="url(#colorPrice)" 
            isAnimationActive={false} 
          />
          
          {/* Indicator Lines */}
          <Line type="monotone" dataKey="ema" stroke="#60a5fa" strokeWidth={1} dot={false} isAnimationActive={false} />
          <Line type="monotone" dataKey="upper" stroke="#f97316" strokeWidth={1} strokeDasharray="2 2" dot={false} isAnimationActive={false} opacity={0.4} />
          <Line type="monotone" dataKey="lower" stroke="#f97316" strokeWidth={1} strokeDasharray="2 2" dot={false} isAnimationActive={false} opacity={0.4} />

          <ReferenceLine y={currentPrice} stroke={isUp ? '#10B981' : '#EF4444'} strokeDasharray="3 3" opacity={0.8} />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
};

export default MarketChart;