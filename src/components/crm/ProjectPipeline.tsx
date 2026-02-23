import { useState, useEffect } from 'react';
import { 
  Plus, 
  ChevronRight,
  Target
} from 'lucide-react';
import { getCrmProjects, updateCrmProjectStage } from '../../services/crmService';
import type { ProjectStage } from '../../types/crm';
import { motion } from 'framer-motion';
import clsx from 'clsx';

const STAGES: { id: ProjectStage; label: string; color: string }[] = [
  { id: 'NEEDS', label: '니즈파악', color: 'bg-slate-800' },
  { id: 'SAMPLE', label: '샘플제안', color: 'bg-blue-900/40' },
  { id: 'TEST', label: '테스트/검증', color: 'bg-indigo-900/40' },
  { id: 'NEGOTIATION', label: '단가협의', color: 'bg-amber-900/40' },
  { id: 'WIN', label: '수주완료', color: 'bg-emerald-900/40' },
  { id: 'DROP', label: '실패', color: 'bg-rose-900/40' },
];

export const ProjectPipeline = () => {
  const [projects, setProjects] = useState<any[]>([]);

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      const data = await getCrmProjects();
      setProjects(data);
    } catch (error) {
      console.error('Failed to fetch projects:', error);
    }
  };

  const handleStageChange = async (projectId: string, newStage: ProjectStage) => {
    try {
      await updateCrmProjectStage(projectId, newStage);
      fetchProjects();
    } catch (error) {
      console.error('Failed to update stage:', error);
    }
  };

  const getProjectsByStage = (stageId: ProjectStage) => {
    return projects.filter(p => p.stage === stageId);
  };

  return (
    <div className="flex gap-4 overflow-x-auto pb-6 no-scrollbar">
      {STAGES.map((stage) => (
        <div 
          key={stage.id}
          className="flex-shrink-0 w-80 flex flex-col gap-4"
        >
          {/* Column Header */}
          <div className="flex items-center justify-between px-2">
            <h3 className="text-xs font-black text-slate-500 uppercase tracking-[0.2em] flex items-center gap-2">
              <span className={clsx("w-1.5 h-1.5 rounded-full", stage.color.replace('bg-', 'bg-').replace('/40', ''))}></span>
              {stage.label}
              <span className="ml-1 text-[10px] opacity-50">({getProjectsByStage(stage.id).length})</span>
            </h3>
            <button className="p-1 hover:bg-slate-800 rounded-md transition-colors">
              <Plus className="w-3 h-3 text-slate-500" />
            </button>
          </div>

          {/* Kanban Cards Container */}
          <div className={clsx(
            "flex-1 p-3 rounded-[32px] border border-slate-800/50 min-h-[500px] space-y-3",
            stage.color
          )}>
            {getProjectsByStage(stage.id).map((project, idx) => (
              <motion.div
                key={project.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="group relative p-4 rounded-2xl bg-slate-900 border border-slate-800 hover:border-blue-500/50 shadow-lg cursor-pointer transition-all"
              >
                <div className="flex justify-between items-start mb-2">
                  <h4 className="text-sm font-bold text-slate-100 line-clamp-2 leading-tight group-hover:text-blue-400 transition-colors">
                    {project.title}
                  </h4>
                </div>
                
                <div className="space-y-2">
                  <p className="text-[10px] font-bold text-slate-500 flex items-center gap-1.5">
                    <Target className="w-3 h-3" />
                    {project.crm_companies?.name}
                  </p>
                  
                  <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-800/50">
                    <div className="flex flex-col">
                      <span className="text-[9px] text-slate-500 uppercase font-black tracking-tighter">Expected</span>
                      <span className="text-xs font-mono font-bold text-slate-200">
                        ${(project.expected_value / 1000).toFixed(1)}K
                      </span>
                    </div>
                    
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        // Find next stage
                        const currentIdx = STAGES.findIndex(s => s.id === stage.id);
                        if (currentIdx < STAGES.length - 1) {
                          handleStageChange(project.id, STAGES[currentIdx + 1].id);
                        }
                      }}
                      className="p-2 rounded-xl bg-slate-800 hover:bg-blue-600 hover:text-white text-slate-400 transition-all active:scale-95"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
            
            {getProjectsByStage(stage.id).length === 0 && (
              <div className="h-20 flex items-center justify-center border border-dashed border-slate-800 rounded-2xl opacity-30">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">No Projects</span>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};
