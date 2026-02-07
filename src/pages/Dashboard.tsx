// src/pages/Dashboard.tsx
import { DailyPicks } from '../components/dashboard/DailyPicks';
import { MorningBrief } from '../components/dashboard/MorningBrief';
import { BacktestChart } from '../components/dashboard/BacktestChart';
import { WatchlistView } from '../components/dashboard/WatchlistView';
import { PersonaPerformance } from '../components/dashboard/PersonaPerformance';
import { Badge } from '../components/ui/Badge';

export const Dashboard = () => {
  return (
    <div className="p-6 max-w-[1600px] mx-auto space-y-10 animate-in fade-in duration-700">
      
      {/* 1. 최상단: 시장 상황 요약 (간결한 리스트 형태로 수정 권장) */}
      <header className="w-full">
        <MorningBrief /> 
      </header>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
        
        {/* 2. 좌측 메인 (8칸): 실시간 AI 사냥 및 발굴 종목 리스트 */}
        <div className="xl:col-span-8 space-y-8">
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-white tracking-tight">Market Discovery</h2>
              <Badge variant="primary">AI RANKED</Badge>
            </div>
            {/* 이 내부에서 SNDL, FCEL 등의 상세 카드가 렌더링됨 */}
            <DailyPicks /> 
          </section>
        </div>

        {/* 3. 우측 사이드 (4칸): 개인화 데이터 지표 */}
        <aside className="xl:col-span-4 space-y-8">
          <WatchlistView />
          <PersonaPerformance />
        </aside>
      </div>

      {/* 4. 최하단: 와이드 뷰 전략 시뮬레이터 */}
      <footer className="w-full pt-10 border-t border-white/5">
        <div className="flex items-center gap-3 mb-8">
          <div className="h-6 w-1 bg-indigo-500 rounded-full shadow-[0_0_10px_rgba(99,102,241,0.8)]" />
          <h2 className="text-2xl font-bold text-white uppercase tracking-tighter">Time Machine Simulator</h2>
        </div>
        <BacktestChart ticker="AAPL" /> 
      </footer>
    </div>
  );
};
