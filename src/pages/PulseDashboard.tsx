import { usePulseSocket } from '../hooks/usePulseSocket';
import { QuantSignalCard } from '../components/ui/QuantSignalCard';
import { BacktestChart } from '../components/ui/BacktestChart';
import { Activity, Rocket, Loader2, CheckCircle } from 'lucide-react';
import { useState } from 'react';

const PulseDashboard: React.FC = () => {
  // 백엔드 웹소켓 엔드포인트 구독
  const { pulseMap, isConnected } = usePulseSocket('ws://localhost:8000/ws/pulse');

  // 객체 형태의 데이터를 배열로 변환
  const tickers = Object.keys(pulseMap);

  // 헌팅(수집) 상태 관리
  const [isHunting, setIsHunting] = useState(false);
  const [huntStatus, setHuntStatus] = useState<'success' | 'error' | null>(null);

  // 하이브리드 수동 탐색 트리거 함수
  const handleTriggerHunt = async () => {
    setIsHunting(true);
    setHuntStatus(null);

    try {
      // 프론트엔드 환경변수에서 관리자 키 로드
      const adminKey = import.meta.env.VITE_ADMIN_SECRET_KEY || "muze_secret_key_2024";

      const response = await fetch('http://localhost:8000/api/hunt', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Admin-Key': adminKey,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      console.log(result.message);
      setHuntStatus('success');

      setTimeout(() => setHuntStatus(null), 3000);
    } catch (error) {
      console.error("헌팅 트리거 실패:", error);
      setHuntStatus('error');
      setTimeout(() => setHuntStatus(null), 3000);
    } finally {
      setIsHunting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 p-4 md:p-8 text-slate-100 font-sans">
      <header className="mb-12 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-emerald-400 tracking-tighter flex items-center gap-3">
            <Activity className="w-8 h-8 text-indigo-400 animate-pulse" />
            MuzeStock.Lab Live Pulse
          </h1>
          <p className="text-slate-500 font-medium mt-1">실시간 퀀트 데이터 스트리밍 터미널</p>
        </div>

        <div className="flex items-center gap-4">
          {/* 하이브리드 탐색 트리거 버튼 */}
          <div className="flex items-center gap-3">
            <button
              onClick={handleTriggerHunt}
              disabled={isHunting}
              className={`flex items-center gap-2 px-5 py-2 rounded-xl font-bold text-sm transition-all duration-300 shadow-lg ${
                isHunting 
                  ? 'bg-indigo-600/30 text-indigo-300 cursor-not-allowed border border-indigo-500/20' 
                  : 'bg-indigo-600 hover:bg-indigo-500 text-white border border-indigo-400/50 hover:shadow-[0_0_20px_rgba(99,102,241,0.4)] hover:-translate-y-0.5'
              }`}
            >
              {isHunting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Rocket className="w-4 h-4" />}
              {isHunting ? '엔진 가동 중...' : '딥 헌팅 실행 (Track A+B)'}
            </button>
            
            {/* 상태 피드백 메시지 */}
            {huntStatus === 'success' && (
              <span className="flex items-center gap-1.5 text-xs text-emerald-400 font-bold animate-in fade-in slide-in-from-bottom-2">
                <CheckCircle className="w-3.5 h-3.5" /> 백그라운드 탐색 시작됨
              </span>
            )}
            {huntStatus === 'error' && (
              <span className="text-xs text-rose-400 font-bold animate-in fade-in slide-in-from-bottom-2 flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5" /> 통신 오류
              </span>
            )}
          </div>

          <div className="h-8 w-px bg-slate-800 hidden md:block mx-1"></div>

          {/* 실시간 연결 상태 표시기 */}
          <div className="flex items-center gap-3">
            <div className={`px-4 py-1.5 rounded-full text-[10px] font-black tracking-widest flex items-center gap-2 border transition-all duration-500 ${
              isConnected 
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.1)]' 
                : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
            }`}>
              <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-400 animate-pulse' : 'bg-rose-400'}`}></span>
              {isConnected ? 'PULSE LIVE' : 'OFFLINE'}
            </div>
          </div>
        </div>
      </header>

      {/* 데이터가 없을 때의 초기 화면 */}
      {tickers.length === 0 && (
        <div className="flex flex-col items-center justify-center h-[50vh] text-slate-600 border-2 border-dashed border-slate-800/50 rounded-3xl bg-slate-900/20">
          <div className="w-12 h-12 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin mb-6"></div>
          <p className="font-bold text-lg tracking-tight">백엔드 펄스 엔진(Pulse Engine)에서 첫 번째 신호를 기다리는 중...</p>
          <p className="text-sm opacity-60 mt-2">상단의 '딥 헌팅 실행' 버튼을 눌러 새로운 시장 퀀트 발굴을 시작해 보세요.</p>
        </div>
      )}

      {/* 실시간 데이터 그리드 렌더링 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-8">
        {tickers.map((ticker) => {
          const rawData = pulseMap[ticker];
          
          // 백엔드 페이로드를 QuantSignalCard 규격에 맞게 매핑
          const cardData = {
            dna_score: rawData.ai_metadata?.dna_score || 50,
            bull_case: rawData.ai_metadata?.bull_case || "분석 지표 수집 중...",
            bear_case: rawData.ai_metadata?.bear_case || "리스크 요인 스캔 중...",
            reasoning_ko: rawData.ai_metadata?.reasoning_ko || rawData.ai_report,
            tags: rawData.ai_metadata?.tags || [ticker, "PULSE"]
          };

          return (
            <div key={ticker} className="animate-in fade-in slide-in-from-bottom-4 duration-700 ease-out fill-mode-both">
              <div className="flex items-center gap-3 mb-4 pl-1">
                <div className="w-1.5 h-6 bg-indigo-500 rounded-full shadow-[0_0_10px_rgba(99,102,241,0.5)]"></div>
                <h2 className="text-2xl font-black tracking-tighter text-white">{ticker}</h2>
                <span className="text-[10px] font-mono text-slate-500 opacity-50 ml-auto">LAST_SYNC: {new Date(rawData.timestamp).toLocaleTimeString()}</span>
              </div>
              <QuantSignalCard data={cardData} />
              
              {/* 백테스트 누적 수익률 차트 연동 */}
              <div className="mt-4">
                <BacktestChart ticker={ticker} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default PulseDashboard;
