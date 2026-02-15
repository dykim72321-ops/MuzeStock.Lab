import { Outlet, NavLink } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { LayoutDashboard, List, Settings, Zap, Search } from 'lucide-react';
import clsx from 'clsx';
import { useMarketPulse } from '../../hooks/useMarketPulse';
import { Toaster } from 'sonner';

export const Layout = () => {
  // Activate Realtime Pulse Listener
  const lastSignal = useMarketPulse();

  return (
    <div className="flex min-h-screen bg-[#020617] text-slate-100 font-sans">
      <Toaster position="top-right" theme="dark" />

      {/* ⚡ Realtime Pulse Indicator (Global) */}
      <div className="fixed top-4 right-4 z-[100] flex items-center gap-2 pointer-events-none">
        {lastSignal && (
          <div className={clsx(
            "px-3 py-1.5 rounded-full border shadow-2xl backdrop-blur-md flex items-center gap-2 animate-in slide-in-from-top-2 duration-300",
            lastSignal.signal === 'OVERSOLD' ? "bg-emerald-500/20 border-emerald-500/40 text-emerald-400" :
              lastSignal.signal === 'OVERBOUGHT' ? "bg-rose-500/20 border-rose-500/40 text-rose-400" :
                "bg-slate-800/80 border-slate-700 text-slate-400"
          )}>
            <Zap className={clsx("w-3 h-3 fill-current", lastSignal ? "animate-pulse" : "")} />
            <span className="text-xs font-bold font-mono">
              {lastSignal.ticker} RSI: {lastSignal.value}
            </span>
          </div>
        )}
      </div>

      {/* 고정 사이드바 너비 확보 */}
      <aside className="hidden lg:block fixed inset-y-0 left-0 w-64 border-r border-white/5 bg-slate-900/40 backdrop-blur-xl z-50">
        <Sidebar />
      </aside>

      {/* 메인 컨텐츠 영역: 사이드바 너비만큼 왼쪽 마진 부여 */}
      <main className="flex-1 lg:ml-64 overflow-x-hidden pb-20 lg:pb-0">
        <div className="p-4 md:p-8">
          <Outlet />
        </div>
      </main>

      {/* Mobile Nav Bar */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 h-16 bg-slate-900/80 backdrop-blur-lg border-t border-white/5 flex items-center justify-around px-2 z-50">
        <NavLink to="/" className={({ isActive }) => clsx("flex flex-col items-center gap-1 px-3 py-1 rounded-lg transition-colors", isActive ? "text-indigo-400 bg-indigo-500/5" : "text-slate-500")}>
          <LayoutDashboard className="w-5 h-5" />
          <span className="text-[10px] font-bold">Discovery</span>
        </NavLink>
        <NavLink to="/scanner" className={({ isActive }) => clsx("flex flex-col items-center gap-1 px-3 py-1 rounded-lg transition-colors", isActive ? "text-indigo-400 bg-indigo-500/5" : "text-slate-500")}>
          <Search className="w-5 h-5" />
          <span className="text-[10px] font-bold">Scanner</span>
        </NavLink>
        <NavLink to="/watchlist" className={({ isActive }) => clsx("flex flex-col items-center gap-1 px-3 py-1 rounded-lg transition-colors", isActive ? "text-indigo-400 bg-indigo-500/5" : "text-slate-500")}>
          <List className="w-5 h-5" />
          <span className="text-[10px] font-bold">Watchlist</span>
        </NavLink>
        <NavLink to="/settings" className={({ isActive }) => clsx("flex flex-col items-center gap-1 px-3 py-1 rounded-lg transition-colors", isActive ? "text-indigo-400 bg-indigo-500/5" : "text-slate-500")}>
          <Settings className="w-5 h-5" />
          <span className="text-[10px] font-bold">Settings</span>
        </NavLink>
      </div>
    </div>
  );
};
