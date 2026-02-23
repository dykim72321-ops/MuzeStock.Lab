import { ProjectPipeline } from '../components/crm/ProjectPipeline';
import { KanbanSquare, Filter, Plus } from 'lucide-react';

export const ProjectsPage = () => {
  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-slate-100 flex items-center gap-3">
            <KanbanSquare className="w-8 h-8 text-blue-500" />
            영업 파이프라인 <span className="text-blue-500/50">Pipeline</span>
          </h1>
          <p className="text-slate-400 mt-1 font-medium">니즈 발굴부터 수주까지의 영업 진행 상황 관리</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="px-4 py-2 bg-slate-800/50 hover:bg-slate-800 text-slate-300 rounded-xl border border-slate-700 transition-colors flex items-center gap-2 text-xs font-black uppercase tracking-widest">
            <Filter className="w-3 h-3" />
            필터링
          </button>
          <button className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl shadow-[0_0_20px_rgba(37,99,235,0.4)] transition-all flex items-center gap-2 text-sm font-bold">
            <Plus className="w-4 h-4" />
            새 프로젝트
          </button>
        </div>
      </header>

      <div className="relative">
        {/* Kanban Board Container - Allows horizontal overflow */}
        <div className="no-scrollbar">
          <ProjectPipeline />
        </div>
      </div>
    </div>
  );
};
