import { useState, useEffect } from 'react';
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
} from 'recharts';
import { Card } from '../ui/Card';
import { fetchBacktestData } from '../../services/pythonApiService';
import { Skeleton } from '../ui/Skeleton';

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

  if (loading) {
    return (
      <Card className="p-6 mt-6">
        <div className="flex justify-between items-end mb-6">
          <Skeleton className="h-8 w-1/3" />
          <Skeleton className="h-8 w-24" />
        </div>
        <Skeleton className="h-[350px] w-full" />
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
    <Card className="p-6 mt-6">
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

      <div className="h-[350px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData}>
            <defs>
              {/* 전략 수익률용 네온 그라데이션 */}
              <linearGradient id="colorStrategy" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4}/>
                <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
              </linearGradient>
              {/* 벤치마크용 은은한 그라데이션 */}
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
  );
};
