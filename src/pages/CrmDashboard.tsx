import { useState, useEffect } from 'react';
import { 
  Users, 
  Briefcase, 
  KanbanSquare, 
  TrendingUp, 
  ShieldAlert, 
  Globe, 
  CheckCircle2,
  Calendar,
  MessageSquare
} from 'lucide-react';
import { motion } from 'framer-motion';
import { getCrmProjects, getCallPlans } from '../services/crmService';
import type { CrmProject, CallPlan } from '../types/crm';
import { format } from 'date-fns';
import clsx from 'clsx';

export const CrmDashboard = () => {
  const [projects, setProjects] = useState<any[]>([]);
  const [callPlans, setCallPlans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [projData, callData] = await Promise.all([
          getCrmProjects(),
          getCallPlans()
        ]);
        setProjects(projData);
        setCallPlans(callData);
      } catch (error) {
        console.error('Failed to load CRM data:', error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const stats = [
    { label: '활성 프로젝트', value: projects.length, icon: KanbanSquare, color: 'text-blue-400' },
    { label: '이번 달 미팅', value: callPlans.length, icon: Calendar, color: 'text-cyan-400' },
    { label: '성공 사례 (Design-in)', value: 0, icon: CheckCircle2, color: 'text-emerald-400' },
    { label: '수주 예상 총액', value: `$${(projects.reduce((acc, p) => acc + (p.expected_value || 0), 0) / 1000).toFixed(1)}K`, icon: TrendingUp, color: 'text-amber-400' },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      {/* 🚀 Header Section */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-slate-100 flex items-center gap-3">
            <Briefcase className="w-8 h-8 text-blue-500" />
            Sales War-Room <span className="text-blue-500/50">Hub</span>
          </h1>
          <p className="text-slate-400 mt-1 font-medium">B2B 영업 지능 및 프로젝트 통합 관리</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl border border-slate-700 transition-colors flex items-center gap-2 text-sm font-bold">
            <Users className="w-4 h-4" />
            고객 관리
          </button>
          <button className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl shadow-[0_0_20px_rgba(37,99,235,0.4)] transition-all transform hover:-translate-y-0.5 active:translate-y-0 flex items-center gap-2 text-sm font-bold">
            <span className="text-lg">+</span>
            새 프로젝트 생성
          </button>
        </div>
      </header>

      {/* 📊 Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="p-6 rounded-2xl bg-slate-900/40 border border-slate-800 backdrop-blur-xl"
          >
            <div className="flex items-center justify-between mb-4">
              <div className={clsx("p-2 rounded-lg bg-slate-800", stat.color)}>
                <stat.icon className="w-6 h-6" />
              </div>
              <span className="text-xs font-bold text-emerald-400 font-mono tracking-widest">+12%</span>
            </div>
            <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">{stat.label}</p>
            <h3 className="text-2xl font-black text-slate-100 mt-1">{stat.value}</h3>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* 🗺️ Supply Chain Heatmap (Placeholder) */}
        <div className="lg:col-span-2 space-y-6">
          <div className="p-8 rounded-3xl bg-slate-900/60 border border-slate-800/50 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4">
              <Globe className="w-32 h-32 text-blue-500/5 absolute -top-8 -right-8" />
            </div>
            <div className="relative z-10">
              <h3 className="text-xl font-bold text-slate-100 flex items-center gap-2 mb-6">
                <Globe className="w-5 h-5 text-cyan-400" />
                Supply Chain Risk Heatmap
              </h3>
              <div className="h-64 flex items-center justify-center border-2 border-dashed border-slate-800 rounded-2xl bg-slate-950/30">
                <div className="text-center">
                  <p className="text-slate-500 font-bold mb-2 uppercase tracking-widest text-xs">Global Sourcing Scan in Progress...</p>
                  <p className="text-slate-400 text-sm italic">"Rare Source 엔진을 통해 전 세계 브로커망을 실시간 스캐닝합니다."</p>
                </div>
              </div>
            </div>
          </div>

          {/* 📈 Active Projects */}
          <div className="p-8 rounded-3xl bg-slate-900/60 border border-slate-800/50">
            <h3 className="text-xl font-bold text-slate-100 flex items-center gap-2 mb-6">
              <KanbanSquare className="w-5 h-5 text-indigo-400" />
              진행 중인 핵심 프로젝트
            </h3>
            <div className="space-y-4">
              {projects.length > 0 ? projects.map((project) => (
                <div key={project.id} className="p-4 rounded-2xl bg-slate-800/40 border border-slate-700/50 hover:bg-slate-800 transition-colors group cursor-pointer">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-bold text-slate-100 group-hover:text-blue-400 transition-colors">{project.title}</h4>
                      <p className="text-xs text-slate-400 flex items-center gap-2 mt-1">
                        <Briefcase className="w-3 h-3" /> {project.crm_companies?.name}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="px-2 py-1 rounded-md bg-indigo-500/10 text-indigo-400 text-[10px] font-bold uppercase tracking-widest border border-indigo-500/20">
                        {project.stage}
                      </span>
                      <p className="text-xs font-mono font-bold text-slate-300 mt-2">${(project.expected_value / 1000).toFixed(1)}K</p>
                    </div>
                  </div>
                </div>
              )) : (
                <p className="text-center py-10 text-slate-500 italic">표시할 프로젝트가 없습니다.</p>
              )}
            </div>
          </div>
        </div>

        {/* 🔔 Right Sidebar: Alerts & Insights */}
        <div className="space-y-6">
          {/* Risk Alerts */}
          <div className="p-6 rounded-3xl bg-rose-950/10 border border-rose-500/20">
            <h3 className="text-red-400 font-bold flex items-center gap-2 mb-4 text-sm tracking-tight">
              <ShieldAlert className="w-4 h-4" />
              Critical Insights & Risks
            </h3>
            <div className="space-y-3">
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20">
                <p className="text-xs text-rose-300 font-bold leading-relaxed">
                  [위험] A사 프로젝트용 센서 글로벌 재고 급감! 
                  <span className="block mt-1 text-[10px] opacity-70 underline">Rare Source로 대체품 확인 권장</span>
                </p>
              </div>
              <div className="p-3 rounded-xl bg-orange-500/10 border border-orange-500/20">
                <p className="text-xs text-orange-300 font-bold leading-relaxed">
                  [넛지] B사 구매팀장 2주째 팔로업 부재. 
                  <span className="block mt-1 text-[10px] opacity-70">오늘 안부 주식 메시지 발송 예정</span>
                </p>
              </div>
            </div>
          </div>

          {/* Recent Call Plans */}
          <div className="p-6 rounded-3xl bg-slate-900/60 border border-slate-800/50">
            <h3 className="text-slate-100 font-bold flex items-center gap-2 mb-4 text-sm">
              <MessageSquare className="w-4 h-4 text-blue-400" />
              최근 미팅 로그
            </h3>
            <div className="space-y-4">
              {callPlans.slice(0, 3).map((plan) => (
                <div key={plan.id} className="relative pl-4 border-l-2 border-slate-800 group cursor-pointer hover:border-blue-500 transition-colors">
                  <p className="text-[10px] text-slate-500 font-bold font-mono uppercase">{format(new Date(plan.visit_date), 'MMM dd, yyyy')}</p>
                  <p className="text-xs font-bold text-slate-200 mt-1 line-clamp-1">{plan.crm_contacts?.name} 미팅</p>
                  <p className="text-[10px] text-slate-400 mt-1 line-clamp-2 italic">"{plan.notes || '기술 미팅 진행 및 샘플 제안'}"</p>
                </div>
              ))}
              <button className="w-full py-2 text-[10px] font-black text-slate-500 hover:text-slate-300 uppercase tracking-widest border-t border-slate-800 mt-2">
                미팅 전체 기록 보기
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
