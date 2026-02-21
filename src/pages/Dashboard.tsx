import { useState } from 'react';
import { motion } from 'framer-motion';
import { Activity, Rocket, Server, ShieldCheck, 
  Crosshair, Loader2, CheckCircle, BarChart3
} from 'lucide-react';
import clsx from 'clsx';
import { usePulseSocket } from '../hooks/usePulseSocket';
import { QuantSignalCard } from '../components/ui/QuantSignalCard';
import { BacktestChart } from '../components/ui/BacktestChart';

export const Dashboard = () => {
  // 1. WebSocket을 통한 v4 펄스 엔진 실시간 데이터 수신
  // pulseMap: 전체 종목의 최신 상태 맵, lastUpdatedTicker: Live Flash 트리거
  const { pulseMap, isConnected, lastUpdatedTicker } = usePulseSocket('ws://localhost:8000/ws/pulse');
  // 전체 종목 맵 중 BUY 시그널만 필터링 (HOLD/NORMAL은 작전 지휘소에 불필요)
  const buyTickers = Object.keys(pulseMap).filter(
    (t) => pulseMap[t].signal === 'BUY'
  );
  // Live Signals 카운터: BUY 신호 수만 표시
  const allTickers = Object.keys(pulseMap);

  // 2. 하이브리드 수동 탐색(Hunting) 상태 관리
  const [isHunting, setIsHunting] = useState(false);
  const [huntStatus, setHuntStatus] = useState<'success' | 'error' | null>(null);

  const handleTriggerHunt = async () => {
    setIsHunting(true);
    setHuntStatus(null);
    try {
      const adminKey = import.meta.env.VITE_ADMIN_SECRET_KEY || "your_dev_secret_key";
      const response = await fetch('http://localhost:8000/api/hunt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Admin-Key': adminKey },
      });
      if (!response.ok) throw new Error("API Error");
      setHuntStatus('success');
      setTimeout(() => setHuntStatus(null), 3000);
    } catch (error) {
      console.error("Hunting Error:", error);
      setHuntStatus('error');
      setTimeout(() => setHuntStatus(null), 3000);
    } finally {
      setIsHunting(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      
      {/* 1. Dashboard Header & Status Control */}
      <header className="flex flex-col md:flex-row items-start md:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl font-black text-slate-100 tracking-tight">작전 지휘소</h1>
            <div className="px-2.5 py-1 bg-blue-500/10 border border-blue-500/20 rounded-md flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-blue-400 animate-pulse' : 'bg-red-500'}`}></span>
              <span className="text-xs font-bold text-blue-400">PULSE ENGINE v4</span>
            </div>
          </div>
          <p className="text-sm text-slate-400">실시간 시장 감시 및 AI 퀀트 발굴 시스템</p>
        </div>

        {/* Action Button */}
        <div className="flex items-center gap-3">
          {huntStatus === 'success' && (
            <span className="flex items-center gap-1 text-xs font-semibold text-emerald-400">
              <CheckCircle className="w-4 h-4" /> 탐색기 가동됨
            </span>
          )}
          <button
            onClick={handleTriggerHunt}
            disabled={isHunting}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-all shadow-lg ${
              isHunting 
                ? 'bg-slate-800 text-slate-400 cursor-not-allowed border border-slate-700' 
                : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white border border-blue-500/50 shadow-blue-500/20 hover:shadow-blue-500/40'
            }`}
          >
            {isHunting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Rocket className="w-4 h-4" />}
            {isHunting ? '딥 헌팅 진행 중...' : '하이브리드 헌팅 트리거'}
          </button>
        </div>
      </header>

      {/* 2. Quick Stats Bento Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="quant-panel p-5 flex items-center gap-4">
          <div className="p-3 bg-emerald-500/10 rounded-xl border border-emerald-500/20">
            <ShieldCheck className="w-6 h-6 text-emerald-400" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">시스템 방어력 (MDD)</p>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black text-slate-100 tabular-nums">-2.95%</span>
              <span className="text-xs font-semibold text-emerald-400">Market: -29.1%</span>
            </div>
            <p className="text-[10px] text-slate-600 mt-1">소하이 5년 백테스트 기준</p>
          </div>
        </div>

        <div className="quant-panel p-5 flex items-center gap-4">
          <div className="p-3 bg-purple-500/10 rounded-xl border border-purple-500/20">
            <Crosshair className="w-6 h-6 text-purple-400" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">엔진 승률 (Win Rate)</p>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black text-slate-100 tabular-nums">68.7%</span>
              <span className="text-xs font-semibold text-purple-400">PF: 1.14x</span>
            </div>
            <p className="text-[10px] text-slate-600 mt-1">소하이 5년 백테스트 기준</p>
          </div>
        </div>

        <div className="quant-panel p-5 flex items-center gap-4">
          <div className="p-3 bg-blue-500/10 rounded-xl border border-blue-500/20">
            <Activity className="w-6 h-6 text-blue-400" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">실시간 포착 종목</p>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black text-slate-100 tabular-nums">{buyTickers.length}</span>
              <span className="text-xs font-semibold text-blue-400">
                BUY Signals
                {allTickers.length > 0 && (
                  <span className="ml-1 text-slate-500">/ {allTickers.length} 관측</span>
                )}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Live Signal Feed */}
      <div className="pt-4">
        <h2 className="text-lg font-bold text-slate-200 mb-6 flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-indigo-400" />
          오늘의 AI 포착 종목 및 백테스트 검증
        </h2>

        {buyTickers.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 quant-panel border-dashed border-slate-700 text-slate-500">
            <Server className="w-8 h-8 mb-4 opacity-50" />
            {allTickers.length > 0 ? (
              <>
                <p className="font-medium">
                  현재 BUY 시그널 없음
                  <span className="ml-2 px-2 py-0.5 text-xs bg-slate-800 rounded">
                    {allTickers.length}개 관측 중
                  </span>
                </p>
                <p className="text-xs mt-1 text-slate-600">
                  v4 엔진이 RSI &lt; 45 + MACD 기울기 개선 진입 조건을 스캔 중입니다
                </p>
              </>
            ) : (
              <>
                <p className="font-medium">수신된 펄스 시그널이 없습니다.</p>
                <p className="text-xs mt-1">상단의 '하이브리드 헌팅 트리거'를 눌러 시장 스캔을 시작하세요.</p>
              </>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
            {buyTickers.map((ticker) => {
              const rawData = pulseMap[ticker];
              const cardData = {
                dna_score: rawData.ai_metadata?.dna_score || 50,
                bull_case: rawData.ai_metadata?.bull_case || "데이터 분석 중...",
                bear_case: rawData.ai_metadata?.bear_case || "데이터 분석 중...",
                reasoning_ko: rawData.ai_metadata?.reasoning_ko || rawData.ai_report,
                tags: rawData.ai_metadata?.tags || [ticker, rawData.signal]
              };

              return (
                <motion.div 
                  key={ticker} 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={clsx(
                    "flex flex-col gap-4 rounded-2xl p-2 transition-all",
                    lastUpdatedTicker === ticker && "animate-flash-blue"
                  )}
                >
                  <div className="flex items-center gap-3 pl-2 border-l-4 border-blue-500">
                    <h3 className="text-2xl font-black tracking-tighter text-white">{ticker}</h3>
                    <span className="px-2 py-0.5 rounded text-xs font-bold bg-slate-800 text-slate-300">
                      RSI: {rawData.rsi || '-'}
                    </span>
                  </div>
                  
                  {/* 시그널 렌더링 카드 */}
                  <QuantSignalCard data={cardData} />
                  
                  {/* v4 엔진이 적용된 백테스트 차트 */}
                  <div className="h-72 w-full mt-2">
                    <BacktestChart ticker={ticker} />
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}