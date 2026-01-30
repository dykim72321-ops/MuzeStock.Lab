import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, TrendingUp, TrendingDown, AlertTriangle, CheckCircle2, BrainCircuit, Share2 } from 'lucide-react';
import { ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, Radar, Legend } from 'recharts';
import { Badge } from '../ui/Badge';
import { Card } from '../ui/Card';
import clsx from 'clsx';

// 차트 데이터 타입 정의
export const DnaMatchView = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  
  // 실제 데이터 연동 전까지 사용할 Mock Data
  // 나중에 Supabase에서 fetch 해오는 로직으로 대체됩니다.
  const mockAnalysis = {
    score: 87,
    verdict: "STRONG BUY",
    ticker: id || "UNKNOWN",
    price: 0.854,
    change: 12.4,
    sector: "AI Infrastructure",
    radarData: [
      { subject: 'R&D Focus', A: 90, B: 85, fullMark: 100 },
      { subject: 'Revenue Growth', A: 80, B: 90, fullMark: 100 },
      { subject: 'Market Size', A: 95, B: 60, fullMark: 100 },
      { subject: 'Cash Flow', A: 50, B: 40, fullMark: 100 },
      { subject: 'Volatility', A: 70, B: 90, fullMark: 100 },
    ],
    reason: "이 기업은 초기 엔비디아와 놀라울 정도로 유사한 R&D 투자 패턴을 보이고 있습니다. 특히 매출 대비 연구비 지출이 40%를 상회하며, 이는 기술적 해자(Moat)를 구축 중이라는 강력한 신호입니다.",
    bullPoints: [
      "경영진이 과거 Google DeepMind 출신으로 기술적 비전이 명확함",
      "최근 3일간 거래량이 유통주식의 200%를 회전하며 손바뀜 발생",
      "부채 비율이 동종 업계 대비 30% 낮아 유상증자 리스크 적음"
    ],
    bearPoints: [
      "아직 영업이익이 적자 상태로, 현금 고갈 속도(Burn Rate) 주의 필요",
      "단기 급등에 따른 차익 실현 매물 출회 가능성"
    ]
  };

  useEffect(() => {
    // 로딩 시뮬레이션 (AI가 분석하는 느낌)
    const timer = setTimeout(() => setLoading(false), 1500);
    return () => clearTimeout(timer);
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[80vh]">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <BrainCircuit className="w-6 h-6 text-indigo-400 animate-pulse" />
          </div>
        </div>
        <h2 className="mt-6 text-xl font-bold text-white tracking-tight">AI Agent Analyzing...</h2>
        <p className="text-slate-400 font-mono text-sm mt-2">Comparing DNA with 'NVIDIA 1999'...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in pb-10">
      {/* 1. Top Navigation & Header */}
      <button 
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-2 group"
      >
        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
        <span className="text-sm font-medium">Back to List</span>
      </button>

      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-5xl font-black text-white tracking-tighter font-mono">{mockAnalysis.ticker}</h1>
            <Badge variant="neutral" className="text-xs">{mockAnalysis.sector}</Badge>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-3xl font-mono text-slate-200">${mockAnalysis.price.toFixed(3)}</span>
            <span className={clsx("flex items-center gap-1 font-mono font-bold px-2 py-1 rounded text-sm", 
              mockAnalysis.change > 0 ? "bg-emerald-500/10 text-emerald-400" : "bg-rose-500/10 text-rose-400")}>
              {mockAnalysis.change > 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
              {Math.abs(mockAnalysis.change)}%
            </span>
          </div>
        </div>

        <div className="flex gap-3">
          <button className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg border border-slate-700 transition-colors flex items-center gap-2 text-sm font-medium">
            <Share2 className="w-4 h-4" /> Share Analysis
          </button>
          <button className="px-6 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg shadow-lg shadow-indigo-500/20 font-bold transition-all flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" /> Add to Portfolio
          </button>
        </div>
      </div>

      {/* 2. Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: AI Verdict & Reasoning (2/3 width) */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* AI Verdict Card */}
          <Card className="bg-gradient-to-br from-slate-900 to-slate-800 border-indigo-500/30 shadow-2xl shadow-indigo-900/20 overflow-hidden relative">
            <div className="absolute top-0 right-0 p-32 bg-indigo-500/10 blur-3xl rounded-full pointer-events-none"></div>
            
            <div className="p-8">
              <div className="flex items-start justify-between mb-6">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <BrainCircuit className="w-5 h-5 text-indigo-400" />
                    <span className="text-xs font-bold text-indigo-400 tracking-widest uppercase">AI Growth DNA Analysis</span>
                  </div>
                  <h2 className="text-3xl font-bold text-white mb-1">
                    Verdict: <span className="text-emerald-400">{mockAnalysis.verdict}</span>
                  </h2>
                </div>
                <div className="text-right">
                  <div className="text-6xl font-black text-white font-mono tracking-tighter">{mockAnalysis.score}</div>
                  <div className="text-xs text-slate-400 font-mono mt-1">/ 100 SCORE</div>
                </div>
              </div>

              <div className="bg-slate-950/50 rounded-xl p-6 border border-indigo-500/20 mb-8">
                <p className="text-lg text-slate-200 leading-relaxed font-medium">
                  "{mockAnalysis.reason}"
                </p>
              </div>

              {/* Bull vs Bear Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-emerald-950/30 border border-emerald-500/20 rounded-xl p-5">
                  <h3 className="text-emerald-400 font-bold mb-3 flex items-center gap-2">
                    <TrendingUp className="w-4 h-4" /> Bull Case (Why it could fly)
                  </h3>
                  <ul className="space-y-2">
                    {mockAnalysis.bullPoints.map((point, i) => (
                      <li key={i} className="text-slate-300 text-sm flex items-start gap-2">
                        <span className="text-emerald-500 mt-1">•</span>
                        {point}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="bg-rose-950/30 border border-rose-500/20 rounded-xl p-5">
                  <h3 className="text-rose-400 font-bold mb-3 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4" /> Bear Case (Risks)
                  </h3>
                  <ul className="space-y-2">
                    {mockAnalysis.bearPoints.map((point, i) => (
                      <li key={i} className="text-slate-300 text-sm flex items-start gap-2">
                        <span className="text-rose-500 mt-1">•</span>
                        {point}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Right Column: Visuals & Metrics (1/3 width) */}
        <div className="space-y-6">
          
          {/* Radar Chart Card */}
          <Card className="p-6 flex flex-col items-center justify-center min-h-[400px]">
            <h3 className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-4 w-full text-center">
              DNA Pattern Matching
            </h3>
            <div className="w-full" style={{ height: 300, minHeight: 300 }}>
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="70%" data={mockAnalysis.radarData}>
                  <PolarGrid stroke="#334155" />
                  <PolarAngleAxis dataKey="subject" tick={{ fill: '#94a3b8', fontSize: 10 }} />
                  <PolarAngleAxis />
                  <Radar
                    name="Benchmark (NVDA)"
                    dataKey="A"
                    stroke="#64748b"
                    strokeDasharray="4 4"
                    fill="#64748b"
                    fillOpacity={0.1}
                  />
                  <Radar
                    name="Target Stock"
                    dataKey="B"
                    stroke="#8b5cf6"
                    strokeWidth={3}
                    fill="#8b5cf6"
                    fillOpacity={0.4}
                  />
                  <Legend 
                    wrapperStyle={{ fontSize: '11px', paddingTop: '20px' }} 
                    iconType="circle"
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>
            <p className="text-xs text-center text-slate-500 mt-4">
              <span className="text-indigo-400 font-bold">Purple Area</span> indicates current stock potential.
              <br/>Matches 87% with Early NVIDIA pattern.
            </p>
          </Card>

          {/* Quick Stats */}
          <Card className="p-5">
            <h3 className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-4">
              Key Fundamentals
            </h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center pb-2 border-b border-slate-800">
                <span className="text-sm text-slate-500">Market Cap</span>
                <span className="text-sm font-mono text-white">$45.2M</span>
              </div>
              <div className="flex justify-between items-center pb-2 border-b border-slate-800">
                <span className="text-sm text-slate-500">P/E Ratio</span>
                <span className="text-sm font-mono text-white">-</span>
              </div>
              <div className="flex justify-between items-center pb-2 border-b border-slate-800">
                <span className="text-sm text-slate-500">Volume (24h)</span>
                <span className="text-sm font-mono text-emerald-400">12.5M 🔥</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-500">52W High</span>
                <span className="text-sm font-mono text-white">$1.20</span>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};