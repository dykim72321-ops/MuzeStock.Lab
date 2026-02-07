import { Outlet, NavLink } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { LayoutDashboard, List, Settings } from 'lucide-react';
import clsx from 'clsx';

export const Layout = () => {
  return (
    <div className="flex min-h-screen bg-[#020617] text-slate-100 font-sans">
      {/* 고정 사이드바 너비 확보 */}
      <aside className="hidden lg:block fixed inset-y-0 left-0 w-64 border-r border-white/5 bg-slate-900/50 backdrop-blur-xl z-50">
        <Sidebar />
      </aside>
      
      {/* 메인 컨텐츠 영역: 사이드바 너비만큼 왼쪽 마진 부여 */}
      <main className="flex-1 lg:ml-64 overflow-x-hidden pb-20 lg:pb-0">
        <div className="p-4 md:p-8">
          <Outlet />
        </div>
      </main>
      
      {/* Mobile Nav Bar */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 h-16 bg-slate-900 border-t border-slate-800 flex items-center justify-around px-6 z-50">
        <NavLink to="/" className={({ isActive }) => clsx("flex flex-col items-center gap-1", isActive ? "text-indigo-400" : "text-slate-500")}>
          <LayoutDashboard className="w-5 h-5" />
          <span className="text-[10px] font-bold">Discovery</span>
        </NavLink>
        <NavLink to="/watchlist" className={({ isActive }) => clsx("flex flex-col items-center gap-1", isActive ? "text-indigo-400" : "text-slate-500")}>
          <List className="w-5 h-5" />
          <span className="text-[10px] font-bold">Watchlist</span>
        </NavLink>
        <NavLink to="/settings" className={({ isActive }) => clsx("flex flex-col items-center gap-1", isActive ? "text-indigo-400" : "text-slate-500")}>
          <Settings className="w-5 h-5" />
          <span className="text-[10px] font-bold">Settings</span>
        </NavLink>
      </div>
    </div>
  );
};
