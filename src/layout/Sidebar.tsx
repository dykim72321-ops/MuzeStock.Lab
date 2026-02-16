import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import {
    LayoutDashboard,
    List,
    Settings,
    History,
    Dna,
    Search,
    LifeBuoy,
    Zap
} from 'lucide-react';
import clsx from 'clsx';
import { motion, AnimatePresence } from 'framer-motion';
// 경로 수정: ui 폴더에서 불러옵니다.
import { HelpModal } from '../components/ui/HelpModal';

export const Sidebar = () => {
    const [isHelpOpen, setIsHelpOpen] = useState(false);

    const sections = [
        {
            title: '메인 운영',
            items: [
                { name: '시장 발굴', icon: LayoutDashboard, path: '/', subtitle: 'AI 퀀트 발굴' },
                { name: '마켓 스캐너', icon: Search, path: '/scanner', subtitle: '실시간 탐색기' },
            ]
        },
        {
            title: '분석 및 펀드',
            items: [
                { name: '알파 펀드', icon: Zap, path: '/portfolio', subtitle: '자율 운용 펀드' },
                { name: '백테스팅', icon: History, path: '/backtesting', subtitle: '타임머신 검증' },
            ]
        },
        {
            title: '자산',
            items: [
                { name: '관심 종목', icon: List, path: '/watchlist', subtitle: '관심 종목' },
            ]
        },
        {
            title: '시스템',
            items: [
                { name: '환경 설정', icon: Settings, path: '/settings', subtitle: '환경 설정' },
            ]
        }
    ];

    return (
        <>
            <motion.div
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ duration: 0.5, ease: "circOut" }}
                className="flex h-screen w-64 bg-[#020617]/40 backdrop-blur-3xl border-r border-white/5 flex-col shrink-0 shadow-[4px_0_24px_rgba(0,0,0,0.5)]"
            >

                {/* Brand Header */}
                <div className="p-8 pb-10">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="relative group">
                            <div className="absolute -inset-1.5 bg-gradient-to-r from-indigo-500 to-cyan-500 rounded-xl blur opacity-30 group-hover:opacity-60 transition duration-700"></div>
                            <div className="relative w-10 h-10 rounded-xl bg-[#050510] ring-1 ring-white/10 flex items-center justify-center overflow-hidden border border-white/5 shadow-inner">
                                <Dna className="w-6 h-6 text-indigo-400 relative z-10" />
                            </div>
                        </div>
                        <div>
                            <h1 className="font-black text-xl text-white tracking-tighter leading-none">
                                MuzeStock<span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-cyan-400">.Lab</span>
                            </h1>
                        </div>
                    </div>
                    <div className="flex items-center gap-2.5 pl-1.5 opacity-80">
                        <span className="flex h-1.5 w-1.5 rounded-full bg-cyan-500 shadow-[0_0_12px_rgba(6,182,212,0.8)] animate-pulse"></span>
                        <p className="text-[10px] text-slate-400 font-mono font-black tracking-[0.2em] uppercase">TERMINAL V3.0 ONLINE</p>
                    </div>
                </div>

                {/* Navigation */}
                <nav className="flex-1 px-4 space-y-8 overflow-y-auto py-2 scrollbar-none">
                    {sections.map((section) => (
                        <div key={section.title}>
                            <h3 className="px-3 text-[10px] font-black text-slate-500 uppercase tracking-[0.25em] mb-4 border-l-2 border-indigo-500/20 ml-1">
                                {section.title}
                            </h3>
                            <div className="space-y-1.5">
                                {section.items.map((item) => (
                                    <NavLink
                                        key={item.path}
                                        to={item.path}
                                        className={({ isActive }) =>
                                            clsx(
                                                'group relative flex items-center gap-3.5 px-4 py-3 rounded-2xl transition-all duration-500 overflow-hidden',
                                                isActive
                                                    ? 'text-white bg-white/5 shadow-[0_4px_12px_rgba(0,0,0,0.1)]'
                                                    : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.04]'
                                            )
                                        }
                                    >
                                        {({ isActive }) => (
                                            <>
                                                <AnimatePresence>
                                                    {isActive && (
                                                        <motion.div
                                                            layoutId="active-pill"
                                                            className="absolute inset-0 bg-gradient-to-r from-indigo-500/10 via-indigo-500/5 to-cyan-500/10 rounded-2xl border border-white/10 shadow-[inset_0_0_20px_rgba(99,102,241,0.1)]"
                                                            initial={{ opacity: 0, scale: 0.98 }}
                                                            animate={{ opacity: 1, scale: 1 }}
                                                            exit={{ opacity: 0, scale: 0.98 }}
                                                            transition={{ type: "spring", stiffness: 300, damping: 30 }}
                                                        />
                                                    )}
                                                </AnimatePresence>

                                                <item.icon className={clsx(
                                                    "w-5 h-5 transition-all duration-500 relative z-10",
                                                    isActive ? "text-cyan-400 drop-shadow-[0_0_10px_rgba(34,211,238,0.6)] scale-110" : "text-slate-500 group-hover:text-slate-300 group-hover:scale-105"
                                                )} />

                                                <div className="flex-1 relative z-10">
                                                    <div className={clsx(
                                                        "text-[13px] font-black transition-colors tracking-tight",
                                                        isActive ? "text-white" : "text-slate-400 group-hover:text-slate-200"
                                                    )}>
                                                        {item.name}
                                                    </div>
                                                </div>

                                                {item.name === '알파 펀드' && (
                                                    <div className="relative z-10 flex h-2 w-2">
                                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                                                        <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.6)]"></span>
                                                    </div>
                                                )}
                                            </>
                                        )}
                                    </NavLink>
                                ))}
                            </div>
                        </div>
                    ))}

                    {/* Support Link */}
                    <div className="pt-4 mt-2 border-t border-white/5">
                        <button
                            onClick={() => setIsHelpOpen(true)}
                            className="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-slate-400 hover:text-indigo-400 hover:bg-white/5 transition-all duration-300"
                        >
                            <LifeBuoy className="w-5 h-5" />
                            <span className="text-sm font-bold">사용자 가이드</span>
                        </button>
                    </div>
                </nav>

                {/* Footer Profile */}
                <div className="p-4 border-t border-white/5 bg-slate-950/30 backdrop-blur-md">
                    <div className="flex items-center gap-3">
                        <motion.div
                            whileHover={{ scale: 1.05 }}
                            className="w-10 h-10 rounded-full bg-gradient-to-tr from-indigo-500 to-cyan-500 border border-white/10 shadow-[0_0_15px_rgba(99,102,241,0.3)]"
                        />
                        <div>
                            <p className="text-sm font-bold text-slate-200">작전 사령관</p>
                            <p className="text-[10px] text-emerald-500/80 font-medium tracking-tight flex items-center gap-1">
                                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                                SECURE UPLINK
                            </p>
                        </div>
                    </div>
                </div>
            </motion.div>

            <HelpModal isOpen={isHelpOpen} onClose={() => setIsHelpOpen(false)} />
        </>
    );
};
