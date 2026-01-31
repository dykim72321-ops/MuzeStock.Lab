import { useEffect, useState } from 'react';
import { Card } from '../ui/Card';
import { Skeleton } from '../ui/Skeleton';
import { supabase } from '../../lib/supabase';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Trophy } from 'lucide-react';

interface PersonaStats {
  persona_name: string;
  total_predictions: number;
  correct_predictions: number;
  win_rate: number;
}

const PERSONA_COLORS: Record<string, string> = {
  'Growth Hunter': '#10b981',
  'Risk Manager': '#ef4444',
  'Chart Analyst': '#3b82f6',
  'Value Hunter': '#f59e0b',
};

export const PersonaPerformance = () => {
  const [personas, setPersonas] = useState<PersonaStats[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPersonas = async () => {
      try {
        setLoading(true);
        const { data } = await supabase
          .from('persona_performance')
          .select('*')
          .order('win_rate', { ascending: false });

        setPersonas(data || []);
      } catch (error) {
        console.error('Failed to fetch persona performance:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPersonas();
  }, []);

  if (loading) {
    return (
      <Card className="p-6">
        <Skeleton className="h-6 w-1/3 mb-4" />
        <Skeleton className="h-64" />
      </Card>
    );
  }

  const topPersona = personas[0];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white mb-2">페르소나 성능 분석</h2>
        <p className="text-slate-400">각 AI 페르소나의 예측 정확도 비교</p>
      </div>

      {/* 최고 성능 페르소나 */}
      {topPersona && (
        <Card className="p-6 bg-gradient-to-br from-amber-900/20 to-amber-800/10 border-amber-700/30">
          <div className="flex items-center gap-3 mb-2">
            <Trophy className="w-6 h-6 text-amber-400" />
            <h3 className="text-lg font-bold text-amber-400">최고 성능 페르소나</h3>
          </div>
          <p className="text-2xl font-bold text-white mb-1">{topPersona.persona_name}</p>
          <div className="flex items-center gap-4 text-sm">
            <span className="text-slate-400">
              승률: <span className="text-emerald-400 font-bold">{topPersona.win_rate.toFixed(1)}%</span>
            </span>
            <span className="text-slate-400">
              총 예측: <span className="text-white font-bold">{topPersona.total_predictions}</span>
            </span>
            <span className="text-slate-400">
              성공: <span className="text-emerald-400 font-bold">{topPersona.correct_predictions}</span>
            </span>
          </div>
        </Card>
      )}

      {/* 페르소나별 승률 차트 */}
      <Card className="p-6">
        <h3 className="text-xl font-bold text-white mb-4">페르소나별 승률 비교</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={personas}>
            <XAxis
              dataKey="persona_name"
              stroke="#94a3b8"
              tick={{ fill: '#cbd5e1' }}
            />
            <YAxis
              stroke="#94a3b8"
              tick={{ fill: '#cbd5e1' }}
              label={{ value: '승률 (%)', angle: -90, position: 'insideLeft', fill: '#cbd5e1' }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#1e293b',
                border: '1px solid #334155',
                borderRadius: '8px',
              }}
              formatter={(value) => `${Number(value).toFixed(1)}%`}
            />
            <Bar dataKey="win_rate" radius={[8, 8, 0, 0]}>
              {personas.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={PERSONA_COLORS[entry.persona_name] || '#8b5cf6'}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </Card>

      {/* 상세 테이블 */}
      <Card className="p-6">
        <h3 className="text-xl font-bold text-white mb-4">상세 통계</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-700">
                <th className="text-left py-3 px-4 text-slate-400 font-medium">페르소나</th>
                <th className="text-right py-3 px-4 text-slate-400 font-medium">총 예측</th>
                <th className="text-right py-3 px-4 text-slate-400 font-medium">성공</th>
                <th className="text-right py-3 px-4 text-slate-400 font-medium">승률</th>
              </tr>
            </thead>
            <tbody>
              {personas.map((persona, index) => (
                <tr key={index} className="border-b border-slate-800 hover:bg-slate-800/30">
                  <td className="py-3 px-4 text-white font-medium">{persona.persona_name}</td>
                  <td className="py-3 px-4 text-right text-slate-300">{persona.total_predictions}</td>
                  <td className="py-3 px-4 text-right text-emerald-400">{persona.correct_predictions}</td>
                  <td className="py-3 px-4 text-right">
                    <span className="text-indigo-400 font-bold">{persona.win_rate.toFixed(1)}%</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};
