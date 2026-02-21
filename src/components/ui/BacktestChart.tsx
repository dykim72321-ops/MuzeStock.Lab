import React, { useState, useEffect } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { Activity } from 'lucide-react';

interface BacktestChartProps {
  ticker: string;
}

export const BacktestChart: React.FC<BacktestChartProps> = ({ ticker }) => {
  const [chartData, setChartData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<{ strategyReturn: number; benchmarkReturn: number; alpha: number } | null>(null);

  useEffect(() => {
    const fetchBacktestData = async () => {
      setLoading(true);
      try {
        const response = await fetch('http://localhost:8000/api/backtest', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ticker: ticker, period: '1y', initial_capital: 10000 })
        });
        
        const data = await response.json();
        if (data.chart_data) {
          setChartData(data.chart_data);
          setStats({
            strategyReturn: data.total_return_pct,
            benchmarkReturn: data.benchmark_return_pct,
            alpha: data.outperformance
          });
        }
      } catch (error) {
        console.error("Backtest fetch error:", error);
      } finally {
        setLoading(false);
      }
    };

    if (ticker) {
      fetchBacktestData();
    }
  }, [ticker]);

  if (loading) {
    return (
      <div className="h-64 flex items-center justify-center text-slate-400/80 mt-4 bg-slate-900/40 rounded-2xl border border-slate-800/60 animate-pulse">
        백테스트 시뮬레이션 중...
      </div>
    );
  }

  if (!chartData.length || !stats) return null;

  return (
    <div className="w-full bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl backdrop-blur-md relative overflow-hidden group">
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-purple-500/5 opacity-50 pointer-events-none group-hover:opacity-100 transition-opacity duration-700" />
      
      <div className="flex justify-between items-end mb-6 relative z-10">
        <h3 className="text-lg font-black text-slate-100 flex items-center gap-2 tracking-tight">
          <Activity className="w-5 h-5 text-indigo-400" />
          과거 1년 백테스트 성과 (RSI 역추세)
        </h3>
        
        {/* 성과 요약 뱃지 */}
        <div className="flex gap-4 font-black">
          <div className="flex flex-col items-end">
            <span className="text-slate-500 text-[10px] tracking-widest uppercase">전략 수익률</span>
            <span className={stats.strategyReturn >= 0 ? 'text-emerald-400 drop-shadow-[0_0_8px_rgba(16,185,129,0.3)]' : 'text-rose-400 drop-shadow-[0_0_8px_rgba(244,63,94,0.3)]'}>
              {stats.strategyReturn >= 0 ? '+' : ''}{stats.strategyReturn}%
            </span>
          </div>
          <div className="flex flex-col items-end pl-4 border-l border-slate-700/50">
            <span className="text-slate-500 text-[10px] tracking-widest uppercase">시장(S&P) 대비 초과수익(Alpha)</span>
            <span className={stats.alpha >= 0 ? 'text-indigo-400 drop-shadow-[0_0_8px_rgba(99,102,241,0.3)]' : 'text-amber-400 drop-shadow-[0_0_8px_rgba(245,158,11,0.3)]'}>
              {stats.alpha >= 0 ? '+' : ''}{stats.alpha}%
            </span>
          </div>
        </div>
      </div>

      <div className="h-64 w-full relative z-10 -ml-2">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
            <XAxis dataKey="date" stroke="#64748b" tick={{ fontSize: 10, fill: '#64748b' }} tickMargin={10} minTickGap={30} axisLine={false} tickLine={false} />
            <YAxis stroke="#64748b" domain={['auto', 'auto']} tick={{ fontSize: 10, fill: '#64748b' }} tickMargin={10} axisLine={false} tickLine={false} tickFormatter={(value) => `$${value.toLocaleString()}`} />
            <Tooltip 
              contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.95)', borderColor: '#334155', borderRadius: '12px', color: '#f8fafc', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.5)', backdropFilter: 'blur(8px)' }}
              itemStyle={{ fontWeight: '900', fontSize: '14px' }}
              labelStyle={{ color: '#94a3b8', fontSize: '11px', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.05em' }}
            />
            <Legend wrapperStyle={{ paddingTop: '20px', fontSize: '12px', fontWeight: 'bold' }} iconType="circle" />
            
            {/* 시장 수익률 (회색) */}
            <Line type="monotone" dataKey="benchmark" name="Market (Hold)" stroke="#475569" strokeWidth={2} dot={false} activeDot={{ r: 6, fill: '#475569', stroke: '#0f172a', strokeWidth: 2 }} />
            {/* 내 전략 수익률 (퍼플) */}
            <Line type="monotone" dataKey="strategy" name="Quant Strategy" stroke="#818cf8" strokeWidth={3} dot={false} activeDot={{ r: 8, fill: '#818cf8', stroke: '#0f172a', strokeWidth: 3 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
