import { ContactsPanel } from '../components/crm/ContactsPanel';
import { Users, Filter } from 'lucide-react';

export const ContactsPage = () => {
  return (
    <div className="max-w-[1600px] mx-auto px-6 py-8 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 bg-slate-50 min-h-screen">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-5">
          <div className="p-3 bg-blue-50 rounded-lg">
            <Users className="w-8 h-8 text-[#0176d3]" />
          </div>
          <div>
            <h1 className="text-3xl font-black tracking-tight text-slate-900">
              고객 담당자 <span className="text-slate-300">Contacts</span>
            </h1>
            <p className="text-slate-500 mt-1 font-medium">B2B 이해관계자 및 영향력 지도 관리 매트릭스</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button className="sfdc-button-secondary flex items-center gap-2">
            <Filter className="w-4 h-4" />
            <span>고급 필터링</span>
          </button>
        </div>
      </header>

      <div className="sfdc-card p-6">
        <ContactsPanel />
      </div>
    </div>
  );
};
