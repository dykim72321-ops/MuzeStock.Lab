import { useEffect, useState } from 'react';
import { Card } from '../ui/Card';
import { Skeleton } from '../ui/Skeleton';
import { supabase } from '../../lib/supabase';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { TrendingUp, Target, CheckCircle, XCircle } from 'lucide-react';

interface PredictionStats {
  total: number;
  correct: number;
  accuracy: number;
  avgScore: number;
}

interface DailyStats {
  date: string;
  predictions: number;
  accuracy: number;
}

export const BacktestingDashboard = () => {
  const [stats, setStats] = useState<PredictionStats | null>(null);
  const [dailyStats, setDailyStats] = useState<DailyStats[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        
        // 전체 통계
        const { data: predictions } = await supabase
          .from('ai_predictions')
          .select('*')
          .not('checked_at', 'is', null);

        if (predictions && predictions.length > 0) {
          const correct = predictions.filter(p => p.is_correct).length;
          const total = predictions.length;
          const avgScore = predictions.reduce((sum, p) => sum + (p.dna_score || 0), 0) / total;

          setStats({
            total,
            correct,
            accuracy: (correct / total) * 100,
            avgScore,
          });

          // 일별 통계 (최근 7일)
          const dailyData: Record<string, { predictions: number; correct: number }> = {};
          predictions.forEach(p => {
            const date = new Date(p.created_at).toLocaleDateString('ko-KR');
            if (!dailyData[date]) {
              dailyData[date] = { predictions: 0, correct: 0 };
            }
            dailyData[date].predictions++;
            if (p.is_correct) dailyData[date].correct++;
          });

          const dailyArray = Object.entries(dailyData).map(([date, data]) => ({
            date,
            predictions: data.predictions,
            accuracy: (data.correct / data.predictions) * 100,
          })).slice(-7);

          setDailyStats(dailyArray);
        }
      } catch (error) {
        console.error('Failed to fetch backtesting stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-1/3" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
        </div>
        <Skeleton className="h-64" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white">AI 백테스팅 결과</h1>
        <p className="text-slate-400 mt-2">AI 예측 정확도 및 성능 트래킹</p>
      </div>
      
      {/* 통계 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-6 bg-gradient-to-br from-slate-900 to-slate-800 border-slate-700">
          <div className="flex items-center justify-between mb-2">
            <p className="text-slate-400 text-sm">총 예측</p>
            <Target className="w-5 h-5 text-indigo-400" />
          </div>
          <p className="text-3xl font-bold text-white">{stats?.total || 0}</p>
        </Card>

        <Card className="p-6 bg-gradient-to-br from-emerald-900/20 to-emerald-800/10 border-emerald-700/30">
          <div className="flex items-center justify-between mb-2">
            <p className="text-slate-400 text-sm">정확한 예측</p>
            <CheckCircle className="w-5 h-5 text-emerald-400" />
          </div>
          <p className="text-3xl font-bold text-emerald-400">{stats?.correct || 0}</p>
        </Card>

        <Card className="p-6 bg-gradient-to-br from-indigo-900/20 to-indigo-800/10 border-indigo-700/30">
          <div className="flex items-center justify-between mb-2">
            <p className="text-slate-400 text-sm">정확도</p>
            <TrendingUp className="w-5 h-5 text-indigo-400" />
          </div>
          <p className="text-3xl font-bold text-indigo-400">
            {stats?.accuracy.toFixed(1) || 0}%
          </p>
        </Card>

        <Card className="p-6 bg-gradient-to-br from-violet-900/20 to-violet-800/10 border-violet-700/30">
          <div className="flex items-center justify-between mb-2">
            <p className="text-slate-400 text-sm">평균 DNA 점수</p>
            <XCircle className="w-5 h-5 text-violet-400" />
          </div>
          <p className="text-3xl font-bold text-violet-400">
            {stats?.avgScore.toFixed(0) || 0}
          </p>
        </Card>
      </div>

      {/* 일별 정확도 차트 */}
      <Card className="p-6">
        <h2 className="text-xl font-bold text-white mb-4">일별 예측 정확도 (최근 7일)</h2>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={dailyStats}>
            <XAxis dataKey="date" stroke="#94a3b8" />
            <YAxis stroke="#94a3b8" />
            <Tooltip
              contentStyle={{
                backgroundColor: '#1e293b',
                border: '1px solid #334155',
                borderRadius: '8px',
              }}
            />
            <Legend />
            <Line
              type="monotone"
              dataKey="accuracy"
              stroke="#8b5cf6"
              strokeWidth={2}
              name="정확도 (%)"
            />
            <Line
              type="monotone"
              dataKey="predictions"
              stroke="#3b82f6"
              strokeWidth={2}
              name="예측 수"
            />
          </LineChart>
        </ResponsiveContainer>
      </Card>
    </div>
  );
};
