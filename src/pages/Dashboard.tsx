// src/pages/Dashboard.tsx
import { DailyPicks } from '../components/dashboard/DailyPicks';
import { MorningBrief } from '../components/dashboard/MorningBrief';
import { BacktestChart } from '../components/dashboard/BacktestChart';
import { WatchlistView } from '../components/dashboard/WatchlistView';
import { PersonaPerformance } from '../components/dashboard/PersonaPerformance';

export const Dashboard = () => {
  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      {/* 상단: 전체 너비를 사용하는 모닝 브리핑 */}
      <header className="w-full">
        <MorningBrief />
      </header>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
        {/* 좌측: 핵심 발견 및 분석 (8칸) */}
        <section className="xl:col-span-8 space-y-8">
          <div className="transition-all duration-500 hover:translate-y-[-4px]">
            <DailyPicks /> 
          </div>
          
          {/* 하단: 시각적 임팩트를 주는 타임머신 차트 */}
          <div className="w-full transition-all duration-500 hover:shadow-[0_0_30px_rgba(99,102,241,0.1)]">
            <BacktestChart ticker="AAPL" /> 
          </div>
        </section>

        {/* 우측: 시장 요약 및 개인화 지표 (4칸) */}
        <aside className="xl:col-span-4 space-y-8">
          <WatchlistView />
          <PersonaPerformance />
        </aside>
      </div>
    </div>
  );
};
