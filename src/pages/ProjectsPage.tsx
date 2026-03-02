import { ProjectPipeline } from '../components/crm/ProjectPipeline';
import { KanbanSquare, Filter, Plus } from 'lucide-react';

export const ProjectsPage = () => {
  return (
    <div className="max-w-[1600px] mx-auto px-6 py-8 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 bg-slate-50 min-h-screen">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-5">
          <div className="p-3 bg-blue-50 rounded-lg">
            <KanbanSquare className="w-8 h-8 text-[#0176d3]" />
          </div>
          <div>
            <h1 className="text-3xl font-black tracking-tight text-slate-900">
              영업 파이프라인 <span className="text-slate-300">Pipeline</span>
            </h1>
            <p className="text-slate-500 mt-1 font-medium">니즈 발굴부터 수주까지의 영업 진행 상황 관리</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button className="sfdc-button-secondary flex items-center gap-2">
            <Filter className="w-4 h-4" />
            <span>필터</span>
          </button>
          <button className="sfdc-button-primary flex items-center gap-2">
            <Plus className="w-4 h-4" />
            <span>새 프로젝트</span>
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
