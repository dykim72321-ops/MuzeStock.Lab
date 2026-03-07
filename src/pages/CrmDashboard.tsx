import { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  Users, 
  Calendar, 
  AlertCircle, 
  CheckCircle2, 
  FileText, 
  ChevronRight,
  ClipboardList,
  Cpu,
  Zap,
  ShieldCheck,
  Bell,
  KanbanSquare,
  TrendingUp,
  ArrowLeft
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { getCrmProjects, getCallPlans, getProjectTimeline } from '../services/crmService';
import { format, isValid } from 'date-fns';
import clsx from 'clsx';
import { SmartCallPlan } from '../components/crm/SmartCallPlan';
import { OrgProfile } from '../components/crm/OrgProfile';

const safeFormatDate = (dateStr?: string | null) => {
  if (!dateStr) return 'UNKNOWN DATE';
  try {
    const d = new Date(dateStr);
    if (!isValid(d)) return 'INVALID DATE';
    return format(d, 'yyyy. MM. dd');
  } catch {
    return 'INVALID DATE';
  }
};

export function CrmDashboard() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [activeCallStep, setActiveCallStep] = useState('during');
  const [projects, setProjects] = useState<any[]>([]);
  const [callPlans, setCallPlans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Hierarchical view state
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [projectTimeline, setProjectTimeline] = useState<any>(null);
  const [timelineLoading, setTimelineLoading] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [projData, callData] = await Promise.all([
          getCrmProjects(),
          getCallPlans()
        ]);
        setProjects(projData || []);
        setCallPlans(callData || []);
      } catch (error) {
        console.error('Failed to load CRM data:', error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const handleProjectClick = async (projectId: string) => {
    setSelectedProjectId(projectId);
    setTimelineLoading(true);
    try {
      const timeline = await getProjectTimeline(projectId);
      setProjectTimeline(timeline);
    } catch (error) {
      console.error('Failed to load project timeline:', error);
    } finally {
      setTimelineLoading(false);
    }
  };

  const totalExpectedValue = projects.reduce((acc, p) => acc + (Number(p?.expected_value) || 0), 0);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] space-y-4">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-indigo-600"></div>
        <p className="text-slate-500 text-sm font-semibold">CRM 데이터를 분석하는 중입니다...</p>
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-100px)] bg-slate-50 text-slate-900 font-sans overflow-hidden rounded-2xl border border-slate-200 shadow-sm">
      {/* 1. Sidebar Navigation */}
      <aside className="w-64 bg-white border-r border-slate-200 flex flex-col shrink-0">
        <div className="p-6 border-b border-slate-100 flex items-center gap-2">
          <div className="bg-[#0176d3] p-1.5 rounded-lg shadow-lg shadow-blue-100">
            <Zap size={20} className="text-white" fill="currentColor" />
          </div>
          <h1 className="text-xl font-black text-slate-800 tracking-tight">
            Sales<span className="text-[#0176d3]">.Hub</span>
          </h1>
        </div>
        
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          <NavItem icon={<LayoutDashboard size={18}/>} label="Dashboard" active={activeTab === 'dashboard'} onClick={() => { setActiveTab('dashboard'); setSelectedProjectId(null); }} />
          <NavItem icon={<ClipboardList size={18}/>} label="Smart Call Plan" active={activeTab === 'call-plan'} onClick={() => setActiveTab('call-plan')} />
          <NavItem icon={<Users size={18}/>} label="Organization" active={activeTab === 'org'} onClick={() => setActiveTab('org')} />
          <NavItem icon={<FileText size={18}/>} label="Minutes" active={activeTab === 'minutes'} onClick={() => setActiveTab('minutes')} />
        </nav>

      </aside>

      {/* 2. Main Area */}
      <main className="flex-1 flex flex-col min-w-0 bg-slate-50">
        {/* Header - Unified with Scanner/Search Hub Style */}
        <header className="mx-8 mt-8 mb-4 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-xl border border-slate-200 shadow-sm shrink-0">
          <div className="flex items-center gap-4">
            {selectedProjectId ? (
              <div className="flex items-center gap-4">
                <button 
                  onClick={() => setSelectedProjectId(null)}
                  className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-slate-400 hover:text-[#0176d3] hover:border-[#0176d3] transition-all"
                >
                  <ArrowLeft size={20} />
                </button>
                <div>
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-0.5">Project Intelligence</p>
                  <h2 className="text-2xl font-black text-slate-900 leading-tight">
                    {projectTimeline?.project?.title || 'Loading...'}
                  </h2>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-4">
                <div className="p-3 bg-[#0176d3] rounded-lg shadow-md">
                  <LayoutDashboard className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-0.5">
                    {activeTab === 'dashboard' ? "Design-Win Pipeline" : 
                     activeTab === 'call-plan' ? "Strategic Discovery" : 
                     activeTab === 'org' ? "Human Capital" : "Knowledge Base"}
                  </p>
                  <h2 className="text-2xl font-black text-slate-900 leading-tight">
                    {activeTab === 'dashboard' && "전체 프로젝트 현황"}
                    {activeTab === 'call-plan' && "Discovery Planner"}
                    {activeTab === 'org' && "조직 관리 및 R&R"}
                    {activeTab === 'minutes' && "회의록 관리"}
                  </h2>
                </div>
              </div>
            )}
          </div>
          <div className="flex items-center gap-5">
            <div className="relative group cursor-pointer">
              <Bell className="text-slate-400 group-hover:text-[#0176d3] transition-colors" size={20} />
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-rose-500 text-white text-[10px] flex items-center justify-center rounded-full border-2 border-white font-bold shadow-sm">3</span>
            </div>
            <div className="h-8 w-px bg-slate-200"></div>
            <div className="flex items-center gap-3 bg-slate-50 pl-4 pr-2 py-1.5 rounded-xl border border-slate-100">
              <span className="text-xs font-black text-slate-500 uppercase tracking-widest">Admin Control</span>
              <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-[#0176d3] to-blue-400 flex items-center justify-center text-white font-black text-xs shadow-md">OP</div>
            </div>
          </div>
        </header>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-8 pb-8">
          <div className="max-w-6xl mx-auto space-y-8">
            <AnimatePresence mode="wait">
              {activeTab === 'dashboard' && !selectedProjectId && (
                <motion.div 
                  key="dashboard-main"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-8"
                >
                  {/* Stats Row */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <StatCard label="활성 프로젝트" value={projects.length} icon={KanbanSquare} color="indigo" />
                    <StatCard label="이번 달 미팅" value={callPlans.length} icon={Calendar} color="rose" />
                    <StatCard label="성공 사례" value="0" icon={CheckCircle2} color="emerald" />
                    <StatCard label="수주 예상 총액" value={`$${(totalExpectedValue / 1000).toFixed(1)}K`} icon={TrendingUp} color="blue" />
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Pipeline */}
                    <div className="lg:col-span-2 space-y-6">
                      <section className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
                        <div className="p-6 border-b border-slate-50 flex items-center justify-between">
                          <h3 className="text-sm font-black text-slate-800 uppercase tracking-tight flex items-center gap-2">
                             <TrendingUp size={18} className="text-indigo-600" /> Opportunity Pipeline
                          </h3>
                          <button className="text-xs font-bold text-indigo-600 hover:underline">View All</button>
                        </div>
                        <div className="divide-y divide-slate-100">
                          {projects.length > 0 ? projects.map(project => (
                              <div 
                                key={project.id} 
                                onClick={() => handleProjectClick(project.id)}
                                className="p-5 hover:bg-slate-50/50 transition-all flex items-center justify-between group cursor-pointer border-l-4 border-l-transparent hover:border-l-[#0176d3]"
                              >
                                <div>
                                  <h4 className="font-bold text-slate-800 group-hover:text-[#0176d3]">{project.title}</h4>
                                  <div className="flex items-center gap-3 mt-1.5 text-xs text-slate-400 font-medium">
                                    <span>{project.crm_companies?.name || 'Unknown Company'}</span>
                                    <span className="w-1 h-1 bg-slate-200 rounded-full"></span>
                                    <span className="font-bold text-slate-600">${((project.expected_value || 0) / 1000).toFixed(1)}K</span>
                                  </div>
                                </div>
                                <div className="text-right flex items-center gap-4">
                                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-black bg-blue-50 text-[#0176d3] border border-blue-100 uppercase">
                                    {project.stage || 'NEEDS'}
                                  </span>
                                  <ChevronRight size={16} className="text-slate-200 group-hover:text-[#0176d3] transition-colors" />
                                </div>
                              </div>
                          )) : (
                            <div className="p-12 text-center text-slate-400 italic">No active opportunities found.</div>
                          )}
                        </div>
                      </section>
                    </div>

                    {/* Alerts & Actions */}
                    <div className="space-y-6">
                      <DashboardCard title="Intelligent Alerts" icon={<AlertCircle className="text-rose-500" size={18} />}>
                        <div className="space-y-4">
                          <AlertItem title="A사 부품 재고 급감" desc="센서 노드 EOL 리스크 감지됨" severity="high" />
                          <AlertItem title="B사 팔로업 필요" desc="2주간 파이프라인 정체" severity="medium" />
                        </div>
                      </DashboardCard>
                    </div>
                  </div>
                </motion.div>
              )}

              {activeTab === 'dashboard' && selectedProjectId && (
                <motion.div 
                  key="project-timeline"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-8"
                >
                  {timelineLoading ? (
                    <div className="p-12 text-center text-slate-400">Loading timeline...</div>
                  ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                      {/* Left: Project Info & History */}
                      <div className="lg:col-span-2 space-y-6">
                        <section className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6">
                          <div className="flex items-center justify-between mb-8">
                            <h3 className="text-lg font-black text-slate-800 uppercase tracking-tight flex items-center gap-2">
                              <ClipboardList size={22} className="text-indigo-600" /> Activity History
                            </h3>
                            <button className="sfdc-button-primary scale-90">회의록 작성</button>
                          </div>
                          
                          <div className="relative pl-8 before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-100">
                            {projectTimeline?.history && projectTimeline.history.length > 0 ? projectTimeline.history.map((log: any, idx: number) => (
                              <div key={log.id || idx} className="mb-10 relative">
                                <div className="absolute left-[-21px] top-1.5 w-3 h-3 rounded-full bg-white border-2 border-[#0176d3] shadow-sm z-10"></div>
                                <div className="p-6 bg-slate-50/50 rounded-2xl border border-slate-100 hover:border-blue-100 transition-all hover:shadow-md hover:shadow-blue-50/50 group">
                                  <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center gap-3">
                                      <span className="text-[10px] font-black text-[#0176d3] uppercase tracking-widest bg-blue-50 px-2.5 py-1 rounded-full border border-blue-100">
                                        {safeFormatDate(log.visit_date)}
                                      </span>
                                      <span className="text-sm font-bold text-slate-700 flex items-center gap-1.5">
                                        <Users size={14} className="text-slate-400" /> {log.crm_contacts?.name}
                                      </span>
                                    </div>
                                    <ChevronRight size={14} className="text-slate-300 group-hover:text-[#0176d3]" />
                                  </div>
                                  <p className="text-sm text-slate-600 leading-relaxed font-medium">
                                    {log.notes || '기술 미팅 및 샘플 제안 진행.'}
                                  </p>
                                </div>
                              </div>
                            )) : (
                              <div className="py-20 text-center text-slate-400 italic">기록된 미팅 활동이 없습니다.</div>
                            )}
                          </div>
                        </section>
                      </div>

                      {/* Right: Technical Context & Risk */}
                      <div className="space-y-6">
                        <DashboardCard title="Technical Specs (VOC)" icon={<Cpu className="text-slate-400" size={18} />}>
                          <div className="space-y-4">
                            <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                              <p className="text-[10px] font-black text-slate-400 uppercase tracking-tighter mb-1.5">Main CPU</p>
                              <p className="text-xs font-bold text-slate-800">Quad-Core 1.8GHz (i.MX8 Series)</p>
                            </div>
                            <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                              <p className="text-[10px] font-black text-slate-400 uppercase tracking-tighter mb-1.5">OS / Kernel</p>
                              <p className="text-xs font-bold text-slate-800">Linux Yocto v5.15</p>
                            </div>
                          </div>
                        </DashboardCard>

                        <DashboardCard title="Supply Chain Risk" icon={<ShieldCheck className="text-emerald-500" size={18} />}>
                          <div className="p-6 bg-emerald-50/50 rounded-2xl border border-emerald-100 text-center">
                            <Zap className="w-8 h-8 text-emerald-500 mx-auto mb-3" />
                            <p className="text-sm font-bold text-emerald-700">No Risk Found</p>
                            <p className="text-[10px] text-emerald-600 mt-1 uppercase font-black">Scanned: Just Now</p>
                          </div>
                        </DashboardCard>
                      </div>
                    </div>
                  )}
                </motion.div>
              )}

              {activeTab === 'call-plan' && (
                <motion.div 
                  key="call-plan"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  <div className="flex p-1.5 bg-slate-200/50 rounded-2xl w-fit shadow-inner">
                    <StepButton label="Pre-Call (준비)" active={activeCallStep === 'pre'} onClick={() => setActiveCallStep('pre')} />
                    <StepButton label="During Meeting (현장)" active={activeCallStep === 'during'} onClick={() => setActiveCallStep('during')} />
                    <StepButton label="After Meeting (확약)" active={activeCallStep === 'after'} onClick={() => setActiveCallStep('after')} />
                  </div>

                  <SmartCallPlan activeStep={activeCallStep} />
                </motion.div>
              )}

              {activeTab === 'org' && (
                <motion.div 
                  key="org"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="bg-white rounded-3xl border border-slate-200 p-12 shadow-sm text-center"
                >
                  <h3 className="text-xl font-black text-slate-800 mb-12">MuzeBIZ.Lab R&R Structure</h3>
                  <div className="flex flex-col items-center gap-16">
                    <OrgProfile name="최지휘" role="Lab Lead" desc="전략 수립 및 AI 모델 총괄" />
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 w-full max-w-4xl">
                      <OrgProfile name="김영업" role="Field Sales" desc="고객 상담 및 기회 발굴" />
                      <OrgProfile name="이기술" role="FAE" desc="기술 검증 및 사양 최적화" />
                      <OrgProfile name="박운영" role="Sales Ops" desc="견적 및 공급망 관리" />
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </main>
    </div>
  );
}

// --- Internal Sub-components ---

const NavItem = ({ icon, label, active, onClick }: any) => (
  <button 
    onClick={onClick}
    className={clsx(
      "w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold transition-all",
      active ? 'bg-blue-50 text-[#0176d3] shadow-sm' : 'text-slate-400 hover:bg-slate-50 hover:text-slate-600'
    )}
  >
    {icon} {label}
  </button>
);

const StepButton = ({ label, active, onClick }: any) => (
  <button 
    onClick={onClick}
    className={clsx(
      "px-6 py-2 rounded-xl text-xs font-black transition-all",
      active ? 'bg-white text-[#0176d3] shadow-md ring-1 ring-slate-100' : 'text-slate-400 hover:text-slate-600'
    )}
  >
    {label}
  </button>
);

const StatCard = ({ label, value, icon: Icon, color }: any) => {
  const colors: any = {
    indigo: 'bg-[#0176d3] shadow-blue-100',
    rose: 'bg-rose-500 shadow-rose-100',
    emerald: 'bg-emerald-500 shadow-emerald-100',
    blue: 'bg-blue-600 shadow-blue-100'
  };
  
  return (
    <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm flex items-center gap-5">
      <div className={clsx("p-3.5 rounded-2xl text-white shadow-lg", colors[color])}>
        <Icon className="w-5 h-5" />
      </div>
      <div>
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{label}</p>
        <h3 className="text-xl font-black text-slate-800 tabular-nums">{value}</h3>
      </div>
    </div>
  );
};

const DashboardCard = ({ title, icon, children }: any) => (
  <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm overflow-hidden">
    <div className="flex items-center gap-2 mb-6 border-b border-slate-50 pb-4">
      {icon}
      <h4 className="font-black text-slate-800 text-sm uppercase tracking-tight">{title}</h4>
    </div>
    {children}
  </div>
);

const AlertItem = ({ title, desc, severity }: any) => (
  <div className="flex items-center justify-between group cursor-pointer">
    <div className="flex items-center gap-3">
      <div className={clsx(
        "w-2 h-2 rounded-full",
        severity === 'high' ? 'bg-rose-500 animate-pulse' : 'bg-amber-400'
      )}></div>
      <div>
        <p className="text-xs font-bold text-slate-700">{title}</p>
        <p className="text-[10px] text-slate-400">{desc}</p>
      </div>
    </div>
    <ChevronRight className="text-slate-200 group-hover:text-indigo-600 transition-colors" size={14} />
  </div>
);