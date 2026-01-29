import { NavLink } from 'react-router-dom';
import { LayoutDashboard, List, Dna, Settings } from 'lucide-react';
import clsx from 'clsx';

export const Sidebar = () => {
  const navItems = [
    { name: '대시보드', icon: LayoutDashboard, path: '/' },
    { name: '모니터링 리스트', icon: List, path: '/watchlist' },
    { name: 'DNA 스캐너', icon: Dna, path: '/scanner' },
    { name: '설정', icon: Settings, path: '/settings' },
  ];

  return (
    <div className="h-screen w-64 bg-slate-900 border-r border-slate-800 flex flex-col text-slate-300">
      <div className="p-6 flex items-center gap-3">
        <div className="bg-indigo-600 p-2 rounded-lg">
          <Dna className="w-6 h-6 text-white" />
        </div>
        <span className="font-bold text-xl text-white tracking-tight">MuzeStock.Lab</span>
      </div>

      <nav className="flex-1 px-4 py-6 space-y-2">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              clsx(
                'flex items-center gap-3 px-4 py-3 rounded-lg transition-colors font-medium',
                isActive
                  ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'
                  : 'hover:bg-slate-800 hover:text-slate-100'
              )
            }
          >
            <item.icon className="w-5 h-5" />
            {item.name}
          </NavLink>
        ))}
      </nav>

      <div className="p-4 border-t border-slate-800">
        <div className="bg-slate-800/50 rounded-lg p-4">
          <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider mb-2">시스템 상태</p>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
            <span className="text-sm text-emerald-400">온라인</span>
          </div>
        </div>
      </div>
    </div>
  );
};
