import { NavLink } from 'react-router-dom';
import { LayoutDashboard, List, Settings, Radio, Target, Trophy, Dna } from 'lucide-react';
import clsx from 'clsx';

export const Sidebar = () => {
  const navItems = [
    { name: '1. Discovery', icon: LayoutDashboard, path: '/', subtitle: 'AI 종목 발굴' },
    { name: '2. Watchlist', icon: List, path: '/watchlist', subtitle: '관심 종목' },
    { name: '3. AI 백테스팅', icon: Target, path: '/backtesting', subtitle: '예측 정확도 분석' },
    { name: '4. 페르소나 성능', icon: Trophy, path: '/personas', subtitle: 'AI 성능 비교' },
    { name: 'Settings', icon: Settings, path: '/settings', subtitle: '시스템 설정' },
  ];

  return (
    <div className="hidden lg:flex h-screen w-72 bg-slate-905 border-r border-slate-800 flex-col">
      {/* 로고 영역 */}
      <div className="p-8 flex items-center gap-3">
        <div className="bg-gradient-to-br from-indigo-600 to-violet-600 p-2.5 rounded-xl shadow-lg shadow-indigo-500/20">
          <Dna className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="font-bold text-xl text-white tracking-tight leading-none">
            MuzeStock<span className="text-indigo-400 font-mono">.Lab</span>
          </h1>
          <p className="text-[10px] text-slate-500 mt-1 font-mono tracking-wider">AI ANALYTICS TERMINAL</p>
        </div>
      </div>

      {/* 네비게이션 */}
      <nav className="flex-1 px-4 space-y-2">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              clsx(
                'group flex items-center gap-4 px-4 py-4 rounded-xl transition-all duration-200 border',
                isActive
                  ? 'bg-slate-800 border-indigo-500/30 shadow-md'
                  : 'border-transparent hover:bg-slate-800/50 hover:border-slate-700'
              )
            }
          >
            {({ isActive }) => (
              <>
                <div className={clsx(
                  "p-2 rounded-lg transition-colors",
                  isActive ? "bg-indigo-500 text-white" : "bg-slate-800 text-slate-400 group-hover:text-slate-200"
                )}>
                  <item.icon className="w-5 h-5" />
                </div>
                <div>
                  <div className={clsx(
                    "font-bold text-sm",
                    isActive ? "text-white" : "text-slate-400 group-hover:text-slate-200"
                  )}>
                    {item.name}
                  </div>
                  <div className="text-[10px] text-slate-500 font-medium">
                    {item.subtitle}
                  </div>
                </div>
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* 하단 시스템 상태 */}
      <div className="p-4 m-4 border border-slate-800 rounded-xl bg-slate-900/50">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider font-mono">System Status</span>
          <Radio className="w-3 h-3 text-emerald-500 animate-pulse" />
        </div>
        <div className="flex items-center gap-2">
          <div className="h-1.5 w-1.5 bg-emerald-500 rounded-full animate-ping"></div>
          <span className="text-xs text-emerald-400 font-mono font-medium">ENGINE ONLINE</span>
        </div>
        <div className="text-[10px] text-slate-600 font-mono mt-1">
          v1.0.2 • Seoul Region
        </div>
      </div>
    </div>
  );
};