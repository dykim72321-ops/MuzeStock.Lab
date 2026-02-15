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
    Wallet,
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
                { name: '알파 펀드', icon: Wallet, path: '/portfolio', subtitle: '자율 운용 펀드' },
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
                className="flex h-screen w-64 bg-slate-950/20 backdrop-blur-md border-r border-white/5 flex-col shrink-0"
            >

                {/* Brand Header */}
                <div className="p-6">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="relative group">
                            <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 to-cyan-500 rounded-lg blur opacity-40 group-hover:opacity-60 transition duration-500"></div>
                            <div className="relative w-8 h-8 rounded-lg bg-[#050510] ring-1 ring-white/10 flex items-center justify-center overflow-hidden">
                                <Dna className="w-5 h-5 text-indigo-400 relative z-10" />
                            </div>
                        </div>
                        <div>
                            <h1 className="font-black text-lg text-white tracking-tighter leading-none">
                                MuzeStock<span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-cyan-400">.Lab</span>
                            </h1>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 pl-1">
                        <span className="flex h-1.5 w-1.5 rounded-full bg-cyan-500 shadow-[0_0_8px_rgba(6,182,212,0.5)] animate-pulse"></span>
                        <p className="text-[9px] text-slate-500 font-mono font-bold tracking-widest uppercase">TERMINAL v3.0 ONLINE</p>
                    </div>
                </div>

                {/* Navigation */}
                <nav className="flex-1 px-3 space-y-6 overflow-y-auto py-2 scrollbar-none">
                    {sections.map((section) => (
                        <div key={section.title}>
                            <h3 className="px-3 text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
                                {section.title}
                            </h3>
                            <div className="space-y-1">
                                {section.items.map((item) => (
                                    <NavLink
                                        key={item.path}
                                        to={item.path}
                                        className={({ isActive }) =>
                                            clsx(
                                                'group relative flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-300 overflow-hidden',
                                                isActive
                                                    ? 'text-white bg-white/5 border border-white/5'
                                                    : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.03]'
                                            )
                                        }
                                    >
                                        {({ isActive }) => (
                                            <>
                                                <AnimatePresence>
                                                    {isActive && (
                                                        <motion.div
                                                            layoutId="active-pill"
                                                            className="absolute inset-0 bg-gradient-to-r from-indigo-500/20 to-cyan-500/20 rounded-xl border border-indigo-500/30 shadow-[inset_0_0_20px_rgba(99,102,241,0.2)]"
                                                            initial={{ opacity: 0, scale: 0.95 }}
                                                            animate={{ opacity: 1, scale: 1 }}
                                                            exit={{ opacity: 0, scale: 0.95 }}
                                                            transition={{ duration: 0.2 }}
                                                        />
                                                    )}
                                                </AnimatePresence>

                                                <item.icon className={clsx(
                                                    "w-5 h-5 transition-all duration-300 relative z-10",
                                                    isActive ? "text-cyan-400 drop-shadow-[0_0_8px_rgba(34,211,238,0.5)]" : "text-slate-500 group-hover:text-slate-300"
                                                )} />

                                                <div className="flex-1 relative z-10">
                                                    <div className={clsx(
                                                        "text-sm font-bold transition-colors tracking-tight",
                                                        isActive ? "text-white" : "text-slate-400 group-hover:text-slate-200"
                                                    )}>
                                                        {item.name}
                                                    </div>
                                                </div>

                                                {item.name === '알파 펀드' && (
                                                    <Zap className="w-3.5 h-3.5 text-amber-500 fill-amber-500/20 animate-pulse relative z-10" />
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
