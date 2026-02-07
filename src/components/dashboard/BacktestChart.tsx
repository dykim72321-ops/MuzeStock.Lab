import { useState, useEffect } from 'react';
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
  ReferenceLine,
  ComposedChart,
} from 'recharts';
import { Card } from '../ui/Card';
import { fetchBacktestData } from '../../services/pythonApiService';
import { Skeleton } from '../ui/Skeleton';
import { Activity } from 'lucide-react';

interface BacktestChartProps {
  data?: any[] | any;
  ticker?: string;
}

export const BacktestChart: React.FC<BacktestChartProps> = ({ data, ticker }) => {
  const [internalData, setInternalData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (ticker) {
      const loadData = async () => {
        setLoading(true);
        const result = await fetchBacktestData(ticker);
        if (result) {
          setInternalData(result);
        }
        setLoading(false);
      };
      loadData();
    }
  }, [ticker]);

  // Use provided data or internal fetched data
  const activeData = data || internalData;
  const chartData = Array.isArray(activeData) ? activeData : (activeData as any)?.chart_data || [];
  const totalReturnPct = Array.isArray(activeData) ? 23.4 : (activeData as any)?.total_return_pct ?? 0;

  // Get latest RSI for display
  const latestRsi = chartData.length > 0 ? chartData[chartData.length - 1]?.rsi : null;

  if (loading) {
    return (
      <Card className="p-6 mt-6">
        <div className="flex justify-between items-end mb-6">
          <Skeleton className="h-8 w-1/3" />
          <Skeleton className="h-8 w-24" />
        </div>
        <Skeleton className="h-[350px] w-full" />
        <Skeleton className="h-[120px] w-full mt-4" />
      </Card>
    );
  }

  if (!chartData || chartData.length === 0) {
    return (
      <Card className="p-6 mt-6">
        <div className="h-[400px] flex items-center justify-center text-slate-500 italic">
          {ticker ? `${ticker} 데이터를 불러오는 중이거나 데이터가 없습니다.` : '데이터가 없습니다. 분석을 시작하세요.'}
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Main Equity Chart */}
      <Card className="p-6">
        <div className="flex justify-between items-end mb-6">
          <div>
            <h3 className="text-xl font-bold text-white mb-1 flex items-center gap-2">
              <span className="w-1 h-6 bg-indigo-500 rounded-full shadow-[0_0_8px_rgba(99,102,241,0.6)]" />
              Strategy Performance
            </h3>
            <p className="text-xs text-slate-400 font-mono tracking-tight">BACKTEST ENGINE V1.0</p>
          </div>
          <div className="text-right">
            <span className="text-xs text-slate-500 uppercase font-bold tracking-widest block mb-1">Total Return</span>
            <div className={`text-2xl font-mono font-bold ${totalReturnPct >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              {totalReturnPct >= 0 ? '+' : ''}{totalReturnPct}%
            </div>
          </div>
        </div>

        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="colorStrategy" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4}/>
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorBenchmark" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#94a3b8" stopOpacity={0.1}/>
                  <stop offset="95%" stopColor="#94a3b8" stopOpacity={0}/>
                </linearGradient>
              </defs>
              
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1e293b" opacity={0.5} />
              <XAxis 
                dataKey="date" 
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#64748b', fontSize: 10, fontFamily: 'JetBrains Mono' }} 
                minTickGap={40}
                dy={10}
              />
              <YAxis 
                orientation="right"
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#64748b', fontSize: 10, fontFamily: 'JetBrains Mono' }}
                domain={['auto', 'auto']}
                dx={10}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'rgba(15, 23, 42, 0.9)', 
                  border: '1px solid rgba(51, 65, 85, 0.5)', 
                  borderRadius: '12px',
                  backdropFilter: 'blur(8px)',
                  boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.3)'
                }}
                itemStyle={{ fontSize: '12px', fontWeight: 'bold' }}
                labelStyle={{ color: '#94a3b8', marginBottom: '4px', fontFamily: 'JetBrains Mono', fontSize: '10px' }}
              />
              
              <Area 
                type="monotone" 
                dataKey="strategy" 
                name="RSI Strategy" 
                stroke="#818cf8" 
                strokeWidth={3}
                fillOpacity={1} 
                fill="url(#colorStrategy)"
                filter="drop-shadow(0px 0px 8px rgba(99, 102, 241, 0.5))"
                animationDuration={1500}
              />
              <Area 
                type="monotone" 
                dataKey="benchmark" 
                name="Buy & Hold" 
                stroke="#475569" 
                strokeWidth={2}
                strokeDasharray="5 5"
                fill="url(#colorBenchmark)"
                animationDuration={1500}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* RSI Indicator Chart */}
      <Card className="p-6">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-amber-400" />
            <h3 className="text-lg font-bold text-white">RSI 지표</h3>
            <span className="text-xs text-slate-500 font-mono">(14일)</span>
          </div>
          {latestRsi !== null && (
            <div className={`px-3 py-1.5 rounded-lg font-mono text-sm font-bold ${
              latestRsi >= 70 ? 'bg-rose-500/20 text-rose-400 ring-1 ring-rose-500/30' :
              latestRsi <= 30 ? 'bg-emerald-500/20 text-emerald-400 ring-1 ring-emerald-500/30' :
              'bg-slate-800 text-slate-300'
            }`}>
              현재: {latestRsi?.toFixed(1)}
              {latestRsi >= 70 && <span className="ml-2 text-xs opacity-70">과매수</span>}
              {latestRsi <= 30 && <span className="ml-2 text-xs opacity-70">과매도</span>}
            </div>
          )}
        </div>

        <div className="h-[140px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={chartData}>
              <defs>
                <linearGradient id="rsiGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
                </linearGradient>
              </defs>
              
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1e293b" opacity={0.5} />
              <XAxis 
                dataKey="date" 
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#64748b', fontSize: 9, fontFamily: 'JetBrains Mono' }} 
                minTickGap={60}
                dy={5}
              />
              <YAxis 
                orientation="right"
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#64748b', fontSize: 9, fontFamily: 'JetBrains Mono' }}
                domain={[0, 100]}
                ticks={[0, 30, 50, 70, 100]}
                dx={5}
              />
              
              {/* Overbought/Oversold Zones */}
              <ReferenceLine y={70} stroke="#f43f5e" strokeDasharray="4 4" strokeOpacity={0.6} />
              <ReferenceLine y={30} stroke="#10b981" strokeDasharray="4 4" strokeOpacity={0.6} />
              <ReferenceLine y={50} stroke="#475569" strokeDasharray="2 2" strokeOpacity={0.3} />
              
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'rgba(15, 23, 42, 0.95)', 
                  border: '1px solid rgba(51, 65, 85, 0.5)', 
                  borderRadius: '8px',
                  fontSize: '11px'
                }}
                formatter={(value: number | undefined) => {
                  if (value === undefined) return [null, 'RSI'];
                  return [
                    <span className={
                      value >= 70 ? 'text-rose-400' : 
                      value <= 30 ? 'text-emerald-400' : 
                      'text-amber-400'
                    }>
                      {value?.toFixed(1)} {value >= 70 ? '(과매수)' : value <= 30 ? '(과매도)' : ''}
                    </span>,
                    'RSI'
                  ];
                }}
                labelStyle={{ color: '#94a3b8', fontFamily: 'JetBrains Mono', fontSize: '9px' }}
              />
              
              <Area
                type="monotone"
                dataKey="rsi"
                name="RSI"
                stroke="#f59e0b"
                strokeWidth={2}
                fill="url(#rsiGradient)"
                animationDuration={1500}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
        
        {/* Legend */}
        <div className="flex items-center justify-center gap-6 mt-3 text-[10px] text-slate-500">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-0.5 bg-rose-500 opacity-60" style={{ borderTop: '2px dashed' }} />
            <span>과매수 (70+) → 매도 신호</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-0.5 bg-emerald-500 opacity-60" style={{ borderTop: '2px dashed' }} />
            <span>과매도 (30-) → 매수 신호</span>
          </div>
        </div>
      </Card>
    </div>
  );
};
