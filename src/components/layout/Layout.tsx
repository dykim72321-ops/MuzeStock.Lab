import { Outlet, NavLink } from 'react-router-dom';
import { Sidebar } from '../../layout/Sidebar';
import { LayoutDashboard, List, Settings, Zap, Search } from 'lucide-react';
import clsx from 'clsx';
import { useMarketPulse } from '../../hooks/useMarketPulse';
import { Toaster } from 'sonner';

export const Layout = () => {
  // Activate Realtime Pulse Listener
  const lastSignal = useMarketPulse();

  return (
    <div className="flex min-h-screen text-slate-100 font-sans selection:bg-cyan-500/30 selection:text-cyan-200">
      <Toaster position="top-right" theme="dark" />

      {/* ⚡ Realtime Pulse Indicator (Global) */}
      <div className="fixed top-4 right-4 z-[100] flex items-center gap-2 pointer-events-none">
        {lastSignal && (
          <div className={clsx(
            "px-3 py-1.5 rounded-full border shadow-[0_0_20px_rgba(0,0,0,0.5)] backdrop-blur-3xl flex items-center gap-2 animate-in slide-in-from-top-2 duration-300",
            lastSignal.signal === 'OVERSOLD' ? "bg-emerald-950/40 border-emerald-500/30 text-emerald-400" :
              lastSignal.signal === 'OVERBOUGHT' ? "bg-rose-950/40 border-rose-500/30 text-rose-400" :
                "bg-slate-900/40 border-white/10 text-slate-300"
          )}>
            <Zap className={clsx("w-3 h-3 fill-current", lastSignal ? "animate-pulse" : "")} />
            <span className="text-xs font-bold font-mono">
              {lastSignal.ticker} RSI: {lastSignal.value}
            </span>
          </div>
        )}
      </div>

      {/* 고정 사이드바 너비 확보 */}
      <aside className="hidden lg:block fixed inset-y-0 left-0 w-64 z-50">
        <Sidebar />
      </aside>

      {/* 메인 컨텐츠 영역: 사이드바 너비만큼 왼쪽 마진 부여 */}
      <main className="flex-1 lg:ml-64 overflow-x-hidden pb-20 lg:pb-0 transition-all duration-300">
        <div className="p-4 md:p-8 max-w-[2000px] mx-auto">
          <Outlet />
        </div>
      </main>

      {/* Mobile Nav Bar */}
      <div className="lg:hidden fixed bottom-4 left-4 right-4 h-16 bg-slate-900/60 backdrop-blur-2xl border border-white/10 rounded-2xl flex items-center justify-around px-2 z-50 shadow-[0_8px_32px_rgba(0,0,0,0.5)]">
        <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/5 to-cyan-500/5 rounded-2xl pointer-events-none" />
        <NavLink to="/" className={({ isActive }) => clsx("flex flex-col items-center gap-1 px-3 py-1 rounded-lg transition-colors relative z-10", isActive ? "text-cyan-400 bg-white/5" : "text-slate-500")}>
          <LayoutDashboard className="w-5 h-5" />
          <span className="text-[10px] font-bold">발굴</span>
        </NavLink>
        <NavLink to="/scanner" className={({ isActive }) => clsx("flex flex-col items-center gap-1 px-3 py-1 rounded-lg transition-colors relative z-10", isActive ? "text-cyan-400 bg-white/5" : "text-slate-500")}>
          <Search className="w-5 h-5" />
          <span className="text-[10px] font-bold">스캐너</span>
        </NavLink>
        <NavLink to="/watchlist" className={({ isActive }) => clsx("flex flex-col items-center gap-1 px-3 py-1 rounded-lg transition-colors relative z-10", isActive ? "text-cyan-400 bg-white/5" : "text-slate-500")}>
          <List className="w-5 h-5" />
          <span className="text-[10px] font-bold">관심종목</span>
        </NavLink>
        <NavLink to="/settings" className={({ isActive }) => clsx("flex flex-col items-center gap-1 px-3 py-1 rounded-lg transition-colors relative z-10", isActive ? "text-cyan-400 bg-white/5" : "text-slate-500")}>
          <Settings className="w-5 h-5" />
          <span className="text-[10px] font-bold">설정</span>
        </NavLink>
      </div>
    </div>
  );
};
