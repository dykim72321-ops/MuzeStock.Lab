import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard, List, Settings,
  Target, Dna, Search, LifeBuoy
} from 'lucide-react';
import clsx from 'clsx';
import { HelpModal } from '../ui/HelpModal';

export const Sidebar = () => {
  const [isHelpOpen, setIsHelpOpen] = useState(false);

  const sections = [
    {
      title: 'Main',
      items: [
        { name: 'Discovery', icon: LayoutDashboard, path: '/', subtitle: 'AI 종목 발굴 (퀀트 사냥)' },
        { name: 'Market Scanner', icon: Search, path: '/scanner', subtitle: '실시간 시장 탐색기' },
      ]
    },
    {
      title: 'Analysis',
      items: [
        { name: 'AI Backtesting', icon: Target, path: '/backtesting', subtitle: '예측 정확도 분석' },
      ]
    },
    {
      title: 'Collection',
      items: [
        { name: 'Watchlist', icon: List, path: '/watchlist', subtitle: '선별 및 투자 관리' },
      ]
    },
    {
      title: 'System',
      items: [
        { name: 'Settings', icon: Settings, path: '/settings', subtitle: '시스템 설정' },
      ]
    }
  ];

  return (
    <>
      <div className="flex h-screen w-64 bg-slate-950/80 backdrop-blur-xl border-r border-white/5 flex-col overflow-hidden">
        {/* 로고 영역 */}
        <div className="p-6 flex items-center gap-3">
          <div className="relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 to-violet-500 rounded-xl blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
            <div className="relative bg-slate-900 ring-1 ring-white/10 p-2.5 rounded-xl flex items-center justify-center">
              <Dna className="w-6 h-6 text-indigo-400" />
            </div>
          </div>
          <div>
            <h1 className="font-bold text-lg text-white tracking-tight leading-none group">
              MuzeStock<span className="text-indigo-500 font-mono">.Lab</span>
            </h1>
            <p className="text-[10px] text-slate-500 mt-1 font-mono tracking-wider font-bold">ANALYSIS CORE v1.2</p>
          </div>
        </div>

        {/* 네비게이션 */}
        <nav className="flex-1 px-3 space-y-6 overflow-y-auto pt-2 scrollbar-none custom-scrollbar">
          {sections.map((section) => (
            <div key={section.title} className="space-y-1">
              <h3 className="px-4 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-2">{section.title}</h3>
              {section.items.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={({ isActive }: { isActive: boolean }) =>
                    clsx(
                      'group relative flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300',
                      isActive
                        ? 'bg-indigo-500/10 text-white'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                    )
                  }
                >
                  {({ isActive }: { isActive: boolean }) => (
                    <>
                      {isActive && (
                        <div className="absolute left-0 w-1 h-5 bg-indigo-500 rounded-full" />
                      )}
                      <div className={clsx(
                        "p-1.5 rounded-lg transition-all duration-300",
                        isActive ? "bg-indigo-500 text-white shadow-[0_0_15px_rgba(99,102,241,0.5)]" : "bg-slate-900 ring-1 ring-white/5 text-slate-500 group-hover:text-indigo-400 group-hover:ring-indigo-500/30"
                      )}>
                        <item.icon className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className={clsx(
                          "font-bold text-sm truncate",
                          isActive ? "text-white" : "text-slate-400 group-hover:text-slate-200"
                        )}>
                          {item.name}
                        </div>
                        <div className="text-[10px] text-slate-600 font-bold truncate group-hover:text-slate-500">
                          {item.subtitle}
                        </div>
                      </div>
                    </>
                  )}
                </NavLink>
              ))}
            </div>
          ))}

          {/* Resources / Help Section */}
          <div className="pt-4 mt-4 border-t border-white/5 space-y-1">
            <h3 className="px-4 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-2">Support</h3>
            <button
              onClick={() => setIsHelpOpen(true)}
              className="w-full group flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 text-slate-400 hover:text-indigo-400 hover:bg-indigo-500/5 border border-transparent hover:border-indigo-500/20 shadow-sm"
            >
              <div className="p-1.5 rounded-lg bg-slate-900 ring-1 ring-white/5 text-slate-500 group-hover:text-indigo-400 group-hover:ring-indigo-500/30 transition-all">
                <LifeBuoy className="w-4 h-4" />
              </div>
              <div className="text-left">
                <div className="font-bold text-sm">How to Use</div>
                <div className="text-[10px] text-slate-600 font-bold group-hover:text-slate-500">사용 가이드 및 팁</div>
              </div>
            </button>
          </div>
        </nav>

        {/* 하단 시스템 상태 */}
        <div className="p-4 border-t border-white/5 bg-slate-900/40 backdrop-blur-md">
          <div className="flex items-center justify-between mb-3 px-1">
            <span className="text-[10px] text-slate-500 font-black uppercase tracking-widest">Core Status</span>
            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
              <div className="h-1.5 w-1.5 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.8)]"></div>
              <span className="text-[10px] text-emerald-400 font-mono font-bold">ONLINE</span>
            </div>
          </div>
          <div className="text-[10px] text-slate-500 font-mono space-y-1 px-1">
            <div className="flex justify-between">
              <span>Ping</span>
              <span className="text-slate-400">12ms</span>
            </div>
            <div className="flex justify-between">
              <span>Region</span>
              <span className="text-slate-400">AWS-SEOUL-1</span>
            </div>
          </div>
        </div>
      </div>

      <HelpModal isOpen={isHelpOpen} onClose={() => setIsHelpOpen(false)} />
    </>
  );
};