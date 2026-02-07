import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area,
  ReferenceLine
} from 'recharts';

interface BacktestChartProps {
  data: any[];
}

export const BacktestChart: React.FC<BacktestChartProps> = ({ data }) => {
  if (!data || data.length === 0) {
    return (
      <div className="h-[400px] flex items-center justify-center text-slate-500 italic">
        데이터가 없습니다. 분석을 시작하세요.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="h-[400px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
            <XAxis 
              dataKey="date" 
              stroke="#94a3b8" 
              fontSize={12}
              tickFormatter={(value) => value.slice(5)} // MM-DD
            />
            <YAxis 
              stroke="#94a3b8" 
              fontSize={12}
              tickFormatter={(value) => `$${(value / 1000).toFixed(1)}k`}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#1e293b',
                border: '1px solid #334155',
                borderRadius: '8px',
                color: '#f8fafc'
              }}
              itemStyle={{ fontSize: '12px' }}
            />
            <Legend verticalAlign="top" height={36} iconType="circle" />
            <Line
              type="monotone"
              dataKey="benchmark"
              name="Buy & Hold (시장)"
              stroke="#94a3b8"
              strokeWidth={2}
              dot={false}
              strokeDasharray="5 5"
            />
            <Line
              type="monotone"
              dataKey="strategy"
              name="RSI 전략"
              stroke="#6366f1"
              strokeWidth={3}
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="h-[150px] w-full border-t border-slate-800 pt-4">
        <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">RSI Indicator</h4>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
            <XAxis dataKey="date" hide />
            <YAxis hide domain={[0, 100]} />
            <Tooltip
               contentStyle={{
                backgroundColor: '#1e293b',
                border: '1px solid #334155',
                borderRadius: '8px',
                color: '#f8fafc'
              }}
            />
            <defs>
              <linearGradient id="rsiGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <Area 
              type="monotone" 
              dataKey="rsi" 
              stroke="#6366f1" 
              fillOpacity={1} 
              fill="url(#rsiGradient)" 
            />
            {/* RSI Levels */}
            <ReferenceLine y={70} stroke="#ef4444" strokeDasharray="3 3" label={{ position: 'right', value: '70', fill: '#ef4444', fontSize: 10 }} />
            <ReferenceLine y={30} stroke="#22c55e" strokeDasharray="3 3" label={{ position: 'right', value: '30', fill: '#22c55e', fontSize: 10 }} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
