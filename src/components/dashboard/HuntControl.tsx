import { useState, useEffect } from 'react';
import { pythonService } from '../../services/pythonService';
import { Play, RefreshCw, AlertCircle, CheckCircle2 } from 'lucide-react';

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

  // 사냥 버튼 클릭 핸들러
  const handleHunt = async () => {
    setLoading(true);
    setStatusMsg("🕵️ AI가 Finviz를 탐색 중입니다... (약 10~30초 소요)");
    try {
      await pythonService.triggerHunt();
      setStatusMsg("✅ 백그라운드 수집이 시작되었습니다! 잠시 후 새로고침 하세요.");
      // 5초 뒤에 목록 갱신 시도
      setTimeout(refreshData, 5000);
    } catch (err) {
      setStatusMsg("❌ 수집 실패: 관리자 키를 확인하세요.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm mb-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-bold flex items-center gap-2">
          <RefreshCw className={loading ? "animate-spin text-indigo-500" : "text-gray-400"} size={20} />
          AI Hunter Control
        </h2>
        <button
          onClick={handleHunt}
          disabled={loading}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-white transition-all
            ${loading ? 'bg-gray-400 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700 active:scale-95'}`}
        >
          <Play size={16} fill="currentColor" />
          {loading ? '탐색 중...' : '지금 수집 시작 (Manual Hunt)'}
        </button>
      </div>

      {/* 상태 메시지 */}
      {statusMsg && (
        <div className={`p-3 rounded-lg text-sm mb-4 flex items-center gap-2 
          ${statusMsg.includes('❌') ? 'bg-red-50 text-red-600' : 'bg-blue-50 text-blue-700'}`}>
          {statusMsg.includes('❌') ? <AlertCircle size={16}/> : <CheckCircle2 size={16}/>}
          {statusMsg}
        </div>
      )}

      {/* 최근 발견 리스트 (전광판) */}
      <div className="space-y-3">
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
          최근 발견된 보석들 (Live Feed)
        </h3>
        {discoveries.length === 0 ? (
          <p className="text-sm text-gray-400 italic">아직 수집된 데이터가 없습니다. '수집 시작'을 눌러보세요.</p>
        ) : (
          <div className="grid gap-3">
            {discoveries.map((stock: any) => (
              <div key={stock.ticker} className="flex justify-between items-center p-3 bg-gray-50 rounded border border-gray-100 hover:bg-indigo-50 transition-colors">
                <div>
                  <span className="font-bold text-gray-900">{stock.ticker}</span>
                  <span className="text-xs text-gray-500 ml-2">{stock.sector}</span>
                </div>
                <div className="text-right">
                  <div className={`text-sm font-bold ${stock.change_percent >= 0 ? 'text-red-500' : 'text-blue-500'}`}>
                    {stock.change_percent}%
                  </div>
                  <div className="text-xs text-indigo-600 font-medium">
                    DNA: {stock.ai_score}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
