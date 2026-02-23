import React from 'react';
import { ContactsPanel } from '../components/crm/ContactsPanel';
import { Users, Filter } from 'lucide-react';

export const ContactsPage = () => {
  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-slate-100 flex items-center gap-3">
            <Users className="w-8 h-8 text-blue-500" />
            고객 담당자 <span className="text-blue-500/50">Contacts</span>
          </h1>
          <p className="text-slate-400 mt-1 font-medium">부서별 이해관계자 및 영향력 지도 관리</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="px-4 py-2 bg-slate-800/50 hover:bg-slate-800 text-slate-300 rounded-xl border border-slate-700 transition-colors flex items-center gap-2 text-xs font-black uppercase tracking-widest">
            <Filter className="w-3 h-3" />
            필터링
          </button>
        </div>
      </header>

      <div className="p-8 rounded-[40px] bg-slate-900/40 border border-slate-800/50 backdrop-blur-3xl shadow-2xl">
        <ContactsPanel />
      </div>
    </div>
  );
};
