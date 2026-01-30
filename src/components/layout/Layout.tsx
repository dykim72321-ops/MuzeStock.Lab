import { Outlet, NavLink } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { LayoutDashboard, List, Settings } from 'lucide-react';
import clsx from 'clsx';

export const Layout = () => {
  return (
    <div className="flex flex-col lg:flex-row min-h-screen bg-slate-950 text-slate-100 font-sans">
      <Sidebar />
      <main className="flex-1 overflow-x-hidden pb-20 lg:pb-0">
        <div className="container mx-auto p-4 md:p-8 max-w-7xl">
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
