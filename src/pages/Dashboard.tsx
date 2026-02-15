import { SystemStatus } from '../components/dashboard/SystemStatus';
import { DailyPicks } from '../components/dashboard/DailyPicks';
import { MorningBrief } from '../components/dashboard/MorningBrief';
import { BacktestChart } from '../components/dashboard/BacktestChart';
import { WatchlistView } from '../components/dashboard/WatchlistView';
import { PersonaLeaderboard } from '../components/dashboard/PersonaLeaderboard';

export const Dashboard = () => {
  return (
    <div className="space-y-8 max-w-[1600px] mx-auto animate-in fade-in duration-500 p-4 md:p-8">
      {/* System Pulse & Status */}
      <SystemStatus />

      {/* 요약: 이제 MorningBrief는 간결한 한 줄 형태입니다 */}
      <MorningBrief />

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
        {/* 중앙: 실제 종목 상세 리스트 (Step 1) */}
        <div className="xl:col-span-8 space-y-6">
          <div className="flex items-center gap-2 mb-2">
            <span className="px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-400 text-[10px] font-bold tracking-tight">STEP 1</span>
            <h2 className="text-xl font-bold text-white tracking-tight">Market Discovery</h2>
          </div>
          <DailyPicks />
        </div>

        {/* 사이드: 관심 종목 및 성능 분석 */}
        <div className="xl:col-span-4 space-y-8">
          <WatchlistView />
          <PersonaLeaderboard />
        </div>
      </div>

      {/* 하단: 백테스트 엔진 (Step 5) */}
      <div className="pt-8 border-t border-white/5">
        <div className="flex items-center gap-2 mb-6">
          <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-400 text-[10px] font-bold tracking-tight">STEP 5</span>
          <h2 className="text-xl font-bold text-white tracking-tight">Time Machine Simulator</h2>
        </div>
        <BacktestChart ticker="AAPL" />
      </div>
    </div>
  );
};

