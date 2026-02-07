import { useState, useEffect } from 'react';
import { pythonService } from '../../services/pythonService';
import { Play, RefreshCw, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Card } from '../ui/Card';
import clsx from 'clsx';

export function HuntControl() {
  const [loading, setLoading] = useState(false);
  const [discoveries, setDiscoveries] = useState<any[]>([]);
  const [statusMsg, setStatusMsg] = useState("");

  // 최신 데이터 불러오기
  const refreshData = async () => {
    const data = await pythonService.getDiscoveries();
    setDiscoveries(data);
  };

  useEffect(() => {
    refreshData();
  }, []);

  const handleHunt = async () => {
    setLoading(true);
    setStatusMsg("🕵️ AI가 Finviz를 탐색 중입니다...");
    try {
      await pythonService.triggerHunt();
      setStatusMsg("✅ 백그라운드 수집이 시작되었습니다!");
      setTimeout(refreshData, 5000);
    } catch (err) {
      setStatusMsg("❌ 수집 실패: 관리자 키를 확인하세요.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-3">
          <div className={clsx(
            "p-2 rounded-lg bg-indigo-500/10 border border-indigo-500/20",
            loading && "animate-pulse"
          )}>
            <RefreshCw className={clsx("w-5 h-5", loading ? "animate-spin text-indigo-400" : "text-slate-400")} />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white tracking-tight">AI Hunter Control</h2>
            <p className="text-[10px] text-slate-500 font-mono uppercase tracking-widest">Master Algorithm v2.1</p>
          </div>
        </div>
        
        <button
          onClick={handleHunt}
          disabled={loading}
          className={clsx(
            "flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-white transition-all shadow-lg",
            loading 
              ? "bg-slate-800 text-slate-500 cursor-not-allowed" 
              : "bg-indigo-600 hover:bg-indigo-500 active:scale-95 shadow-indigo-500/20"
          )}
        >
          <Play size={16} fill="currentColor" />
          {loading ? 'HUNTING...' : 'MANUAL HUNT'}
        </button>
      </div>

      {statusMsg && (
        <div className={clsx(
          "p-3 rounded-xl text-sm mb-6 flex items-center gap-2 border animate-in slide-in-from-top-2 duration-300",
          statusMsg.includes('❌') 
            ? "bg-rose-500/10 text-rose-400 border-rose-500/20" 
            : "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
        )}>
          {statusMsg.includes('❌') ? <AlertCircle size={16}/> : <CheckCircle2 size={16}/>}
          {statusMsg}
        </div>
      )}

      <div className="space-y-4">
        <h3 className="text-[11px] font-bold text-slate-500 uppercase tracking-[0.2em]">
          Live Discovery Feed
        </h3>
        {discoveries.length === 0 ? (
          <div className="p-8 text-center border-2 border-dashed border-white/5 rounded-2xl">
            <p className="text-sm text-slate-500 italic">No real-time data collected yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {discoveries.map((stock: any) => (
              <div 
                key={stock.ticker} 
                className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/5 hover:border-white/10 hover:bg-white/10 transition-all group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-slate-800 flex items-center justify-center font-bold text-indigo-400 font-mono ring-1 ring-white/10">
                    {stock.ticker[0]}
                  </div>
                  <div>
                    <div className="font-bold text-white group-hover:text-indigo-400 transition-colors uppercase font-mono tracking-tighter">
                      {stock.ticker}
                    </div>
                    <div className="text-[10px] text-slate-500 font-medium truncate max-w-[120px]">
                      {stock.sector}
                    </div>
                  </div>
                </div>
                
                <div className="flex flex-col items-end gap-1">
                  <div className={clsx(
                    "text-xs font-bold font-mono",
                    stock.change_percent >= 0 ? 'text-emerald-400' : 'text-rose-400'
                  )}>
                    {stock.change_percent >= 0 ? '+' : ''}{stock.change_percent}%
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[9px] text-slate-500 uppercase font-bold tracking-tighter">DNA:</span>
                    <span className="text-xs text-indigo-400 font-bold font-mono">{stock.ai_score}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Card>
  );
}
