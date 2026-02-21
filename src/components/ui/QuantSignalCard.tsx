import React from 'react';
import { TrendingUp, TrendingDown, AlertCircle, Activity } from 'lucide-react';
import clsx from 'clsx';

// TypeScript 인터페이스 정의
export interface QuantSignalData {
    dna_score: number | null;
    bull_case: string;
    bear_case: string;
    reasoning_ko: string;
    tags?: string[];
}

interface QuantSignalCardProps {
    data: QuantSignalData | null;
}

export const QuantSignalCard: React.FC<QuantSignalCardProps> = ({ data }) => {
    // 데이터가 없을 경우 로딩/에러 처리
    if (!data) return (
        <div className="w-full max-w-2xl p-6 bg-slate-900/50 border border-slate-800 rounded-2xl flex items-center justify-center min-h-[300px]">
            <div className="text-slate-500 animate-pulse font-medium tracking-tight">수학적 퀀트 데이터를 수신 대기 중...</div>
        </div>
    );

    const { dna_score, bull_case, bear_case, reasoning_ko, tags } = data;

    // bull_case/bear_case 평가: placeholder 탐지 (AI 분석 전 기본 문구)
    const isAIPending = !bull_case || bull_case.includes('분석 중') || bull_case.includes('\ub370\uc774\ud130');
    // DNA 50은 기본값 — 실제 AI 스코어가 없으면 '\u2014' 표시
    const showDNA = dna_score && dna_score !== 50 && dna_score > 0;
    // DNA 스코어에 따른 동적 컬러 및 상태 결정
    const getScoreColor = (score: number | null) => {
        if (score === null || score === 0) return 'text-slate-500 bg-slate-800/50 border-slate-700/50';
        if (score >= 80) return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
        if (score >= 60) return 'text-amber-400 bg-amber-500/10 border-amber-500/20';
        return 'text-rose-400 bg-rose-500/10 border-rose-500/20';
    };

    const getProgressBarColor = (score: number | null) => {
        if (score === null || score === 0) return 'bg-slate-700';
        if (score >= 80) return 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]';
        if (score >= 60) return 'bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.5)]';
        return 'bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.5)]';
    };

    return (
        <div className="quant-panel-glow group">
          <div className="quant-panel-content p-6 text-slate-100 font-sans relative overflow-hidden">
            {/* Background Glow Effect */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 blur-[80px] rounded-full pointer-events-none group-hover:bg-indigo-500/10 transition-colors duration-700" />

            {/* 헤더 구역: 타이틀 및 태그 렌더링 */}
            <div className="flex justify-between items-start mb-6 relative z-10">
                <div>
                    <h2 className="text-xl font-black flex items-center gap-2 mb-3 tracking-tight">
                        <Activity className="w-5 h-5 text-indigo-400" />
                        AI 퀀트 추론 매트릭스
                    </h2>
                    <div className="flex flex-wrap gap-2">
                        {tags && tags.length > 0 ? (
                            tags.map((tag, index) => (
                                <span
                                    key={index}
                                    className="px-2.5 py-1 text-[10px] font-black uppercase tracking-widest rounded-md bg-slate-800 text-slate-300 border border-slate-700 shadow-sm"
                                >
                                    {tag}
                                </span>
                            ))
                        ) : (
                            <span className="px-2.5 py-1 text-[10px] font-black uppercase tracking-widest rounded-md bg-slate-800/50 text-slate-500 border border-slate-700/50 border-dashed">
                                식별된 특이 태그 없음
                            </span>
                        )}
                    </div>
                </div>

                {/* DNA 스코어 원형 뱃지 */}
                <div className={clsx(
                    `flex flex-col items-center justify-center w-16 h-16 rounded-full border-2 shrink-0 transition-colors duration-500`,
                    showDNA ? getScoreColor(dna_score) : 'text-slate-600 bg-slate-800/50 border-slate-700/50'
                )}>
                    <span className="text-2xl font-black tracking-tighter">
                        {showDNA ? dna_score : '—'}
                    </span>
                    <span className="text-[9px] uppercase font-black tracking-widest opacity-80 mt-[-2px]">DNA</span>
                </div>
            </div>

            {/* DNA 스코어 프로그레스 바 — 실제 점수 있을 때만 색상 표시 */}
            <div className="w-full bg-slate-800 rounded-full h-1.5 mb-8 overflow-hidden relative z-10">
                <div
                    className={clsx(
                      `h-1.5 rounded-full transition-all duration-1000 ease-out`,
                      showDNA ? getProgressBarColor(dna_score) : 'bg-transparent'
                    )}
                    style={{ width: showDNA ? `${Math.max(0, Math.min(100, dna_score!))}%` : '0%' }}
                ></div>
            </div>

            {/* 분석 내용 그리드 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6 relative z-10">
                {isAIPending ? (
                  /* AI 분석 대기 상태 — 바운싱 닷 스켈레톤 */
                  <div className="col-span-2 flex flex-col items-center justify-center py-8 gap-3 rounded-xl border border-dashed border-slate-700/60 bg-slate-800/20">
                    <div className="flex gap-1">
                      <span className="w-2 h-2 rounded-full bg-slate-600 animate-bounce" style={{ animationDelay: '0ms' }} />
                      <span className="w-2 h-2 rounded-full bg-slate-600 animate-bounce" style={{ animationDelay: '150ms' }} />
                      <span className="w-2 h-2 rounded-full bg-slate-600 animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                    <p className="text-xs font-semibold text-slate-500">AI 심층 분석 준비 중</p>
                    <p className="text-[10px] text-slate-600">STRONG BUY 신호에서 전체 퀀트 매트릭스가 활성화됩니다</p>
                  </div>
                ) : (
                  <>
                    {/* Bull Case */}
                    <div className="p-4 bg-emerald-500/5 rounded-xl border border-emerald-500/10 hover:border-emerald-500/30 transition-colors">
                        <h3 className="text-emerald-400 font-bold text-xs uppercase tracking-widest flex items-center gap-2 mb-3">
                            <TrendingUp className="w-4 h-4" /> 상승 모멘텀 요인
                        </h3>
                        <p className="text-sm text-slate-300 leading-relaxed font-medium break-keep">{bull_case}</p>
                    </div>
                    {/* Bear Case */}
                    <div className="p-4 bg-rose-500/5 rounded-xl border border-rose-500/10 hover:border-rose-500/30 transition-colors">
                        <h3 className="text-rose-400 font-bold text-xs uppercase tracking-widest flex items-center gap-2 mb-3">
                            <TrendingDown className="w-4 h-4" /> 하방 압력 리스크
                        </h3>
                        <p className="text-sm text-slate-300 leading-relaxed font-medium break-keep">{bear_case}</p>
                    </div>
                  </>
                )}
            </div>


            {/* 종합 요약 (Reasoning) */}
            <div className="p-4 bg-indigo-500/5 rounded-xl border border-indigo-500/10 relative z-10 hover:border-indigo-500/30 transition-colors">
                <h3 className="text-indigo-400 font-bold text-xs uppercase tracking-widest flex items-center gap-2 mb-3">
                    <AlertCircle className="w-4 h-4" /> 결정론적 추론 근거 (System Reasoning)
                </h3>
                <p className="text-sm text-slate-300 leading-relaxed font-medium break-keep">
                  {isAIPending
                    ? '엔진이 STRONG 진입 조건 충족 시 AI 보고서를 자동 생성합니다.'
                    : reasoning_ko}
                </p>
            </div>
          </div>
        </div>
    );
};
