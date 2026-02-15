import React from 'react';
import {
    X, HelpCircle, LayoutDashboard, Search,
    Target, List, Zap, ArrowRight
} from 'lucide-react';
import { Card } from './Card';
import clsx from 'clsx';

interface HelpModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const HelpModal: React.FC<HelpModalProps> = ({ isOpen, onClose }) => {
    if (!isOpen) return null;

    const steps = [
        {
            title: '1. 종목 발굴 (Discovery)',
            description: 'AI가 수집한 방대한 데이터를 바탕으로 현재 가장 유망한 종목들을 한눈에 확인하세요.',
            icon: LayoutDashboard,
            color: 'text-indigo-400',
            bg: 'bg-indigo-500/10'
        },
        {
            title: '2. 시장 탐색 (Scanner)',
            description: 'DNA 점수와 실시간 데이터 필터를 사용하여 당신의 투자 스타일에 완벽히 부합하는 종목을 골라내세요.',
            icon: Search,
            color: 'text-sky-400',
            bg: 'bg-sky-500/10'
        },
        {
            title: '3. 전략 검증 (Backtesting)',
            description: '선별된 종목이 실제 과거 시장에서 어떤 성적을 냈는지 AI 백테스팅으로 검증하세요.',
            icon: Target,
            color: 'text-rose-400',
            bg: 'bg-rose-500/10'
        },
        {
            title: '4. 포트폴리오 관리 (Watchlist)',
            description: '검증된 종목을 관심 목록에 추가하고, 최적의 매수/매도 타이밍을 실시간으로 추적하세요.',
            icon: List,
            color: 'text-emerald-400',
            bg: 'bg-emerald-500/10'
        }
    ];

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-slate-950/60 backdrop-blur-md transition-opacity"
                onClick={onClose}
            />

            {/* Modal Content */}
            <Card className="relative w-full max-w-2xl bg-slate-900 border-white/5 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                <div className="p-6 border-b border-white/5 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-indigo-500/20 rounded-lg">
                            <HelpCircle className="w-5 h-5 text-indigo-400" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-white">MuzeStock.Lab 가이드</h2>
                            <p className="text-xs text-slate-500 font-medium">효율적인 퀀트 투자를 위한 4단계 워크플로우</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-white/5 rounded-full transition-colors text-slate-400 hover:text-white"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto custom-scrollbar">
                    <div className="grid gap-4">
                        {steps.map((step, idx) => (
                            <div key={idx} className="group relative flex gap-4 p-4 rounded-xl bg-white/5 border border-transparent hover:border-white/10 transition-all">
                                <div className={clsx("shrink-0 w-12 h-12 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110", step.bg)}>
                                    <step.icon className={clsx("w-6 h-6", step.color)} />
                                </div>
                                <div>
                                    <h3 className="text-sm font-bold text-white mb-1">{step.title}</h3>
                                    <p className="text-xs text-slate-400 leading-relaxed font-medium">
                                        {step.description}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="bg-indigo-500/5 border border-indigo-500/20 rounded-xl p-4 flex items-center gap-4">
                        <div className="p-2 bg-indigo-500/20 rounded-lg shrink-0">
                            <Zap className="w-5 h-5 text-indigo-400 animate-pulse" />
                        </div>
                        <div className="flex-1">
                            <p className="text-xs font-bold text-indigo-300">Pro Tip</p>
                            <p className="text-[11px] text-slate-400">오른쪽 상단의 실시간 펄스 지표를 통해 현재 시장의 과매수/과매도 종목을 즉시 확인하실 수 있습니다.</p>
                        </div>
                    </div>
                </div>

                <div className="p-4 bg-slate-800/50 border-t border-white/5 flex justify-end">
                    <button
                        onClick={onClose}
                        className="px-6 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-lg transition-all active:scale-95 flex items-center gap-2 shadow-lg shadow-indigo-600/20"
                    >
                        시작하기
                        <ArrowRight className="w-4 h-4" />
                    </button>
                </div>
            </Card>
        </div>
    );
};
