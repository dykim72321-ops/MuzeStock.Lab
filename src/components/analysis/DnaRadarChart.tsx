import { Card } from '../ui/Card';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from 'recharts';
import { Database } from 'lucide-react';

interface DnaRadarChartProps {
  data: any[];
}

export const DnaRadarChart: React.FC<DnaRadarChartProps> = ({ data }) => {
  // 데이터 없을 때 placeholder 표시
  if (!data || data.length === 0) {
    return (
      <Card className="p-5 border-slate-800 bg-slate-900/40">
        <div className="flex flex-col items-center justify-center h-[200px] text-slate-500">
          <Database className="w-8 h-8 mb-2 animate-pulse" />
          <span className="text-sm">분석 데이터 로딩 중...</span>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-5 border-indigo-500/30 bg-gradient-to-br from-slate-900 to-indigo-950/20">
      <h3 className="text-indigo-400 text-xs font-bold uppercase tracking-widest mb-4 flex items-center gap-2">
        🧬 DNA Pattern Matching
      </h3>
      <ResponsiveContainer width="100%" height={200}>
        <RadarChart data={data}>
          <PolarGrid stroke="#334155" />
          <PolarAngleAxis dataKey="subject" tick={{ fill: '#94a3b8', fontSize: 10 }} />
          <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fill: '#64748b', fontSize: 9 }} />
          <Radar name="Benchmark" dataKey="A" stroke="#6366f1" fill="#6366f1" fillOpacity={0.1} />
          <Radar name="Target Asset" dataKey="B" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.5} strokeWidth={2} />
        </RadarChart>
      </ResponsiveContainer>
      <div className="flex justify-center gap-4 mt-3 text-xs">
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded-full bg-indigo-500/20 border border-indigo-500"></div>
          <span className="text-slate-400">Benchmark</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded-full bg-purple-500/50 border border-purple-500"></div>
          <span className="text-slate-300">Target Asset</span>
        </div>
      </div>
    </Card>
  );
};
