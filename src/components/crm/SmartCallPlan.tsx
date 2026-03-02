import React, { useState, useEffect } from 'react';
import { MessageSquare, Search, AlertCircle, Target, Lightbulb, Cpu, ShieldCheck, Building2, Briefcase, UserCircle } from 'lucide-react';
import { getCrmCompanies, getCrmProjects, getCrmContacts } from '../../services/crmService';
import clsx from 'clsx';

interface InputGridRowProps {
  icon: React.ReactNode;
  category: string;
  question: string;
  placeholder: string;
}

const InputGridRow = ({ icon, category, question, placeholder }: InputGridRowProps) => (
  <div className="p-6 hover:bg-slate-50/50 transition-colors group">
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-8 items-start">
      <div className="lg:col-span-5">
        <div className="flex items-center gap-2 mb-1">
          {icon}
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{category}</span>
        </div>
        <p className="text-sm font-bold text-slate-700 leading-snug">{question}</p>
      </div>
      <div className="lg:col-span-7">
        <textarea 
          className="w-full h-24 p-4 text-sm bg-white border border-slate-200 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all shadow-inner placeholder:text-slate-300"
          placeholder={placeholder}
        ></textarea>
      </div>
    </div>
  </div>
);

interface FormFieldProps {
  label: string;
  required?: boolean;
  placeholder: string;
}

const FormField = ({ label, required, placeholder }: FormFieldProps) => (
  <div className="space-y-1.5">
    <div className="flex items-center justify-between">
      <label className="text-xs font-black text-slate-500 uppercase tracking-tighter">{label}</label>
      {required && <span className="text-[8px] font-black bg-rose-50 text-rose-500 px-1.5 py-0.5 rounded border border-rose-100">REQUIRED</span>}
    </div>
    <input 
      type="text" 
      className="w-full px-4 py-2.5 text-xs bg-white border border-slate-200 rounded-xl focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-400 outline-none transition-all"
      placeholder={placeholder}
    />
  </div>
);

export function SmartCallPlan({ activeStep }: { activeStep: string }) {
  const [companies, setCompanies] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [contacts, setContacts] = useState<any[]>([]);
  
  const [selectedCompany, setSelectedCompany] = useState('');
  const [selectedProject, setSelectedProject] = useState('');
  const [selectedContact, setSelectedContact] = useState('');

  useEffect(() => {
    getCrmCompanies().then(setCompanies);
  }, []);

  useEffect(() => {
    if (selectedCompany) {
      getCrmProjects().then(data => {
        setProjects(data.filter(p => p.company_id === selectedCompany));
      });
      getCrmContacts(selectedCompany).then(setContacts);
    } else {
      setProjects([]);
      setContacts([]);
    }
    setSelectedProject('');
    setSelectedContact('');
  }, [selectedCompany]);

  if (activeStep === 'pre') {
    return (
      <div className="h-64 border-2 border-dashed border-slate-200 rounded-3xl flex items-center justify-center text-slate-300 font-bold italic">
        Pre-Call Planning Area (Research & Objective Setting)
      </div>
    );
  }

  if (activeStep === 'after') {
    return (
      <div className="h-64 border-2 border-dashed border-slate-200 rounded-3xl flex items-center justify-center text-slate-300 font-bold italic">
        Post-Call Commitment Area (Action Items & Timeline)
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      
      {/* 🧭 Relational Wizard Selectors */}
      <section className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="space-y-2">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
            <Building2 size={12} /> Target Company
          </label>
          <select 
            value={selectedCompany}
            onChange={(e) => setSelectedCompany(e.target.value)}
            className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-indigo-500/20 outline-none"
          >
            <option value="">고객사 선택</option>
            {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>

        <div className="space-y-2">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
            <Briefcase size={12} /> Related Project
          </label>
          <select 
            disabled={!selectedCompany}
            value={selectedProject}
            onChange={(e) => setSelectedProject(e.target.value)}
            className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-indigo-500/20 outline-none disabled:opacity-50"
          >
            <option value="">프로젝트 선택</option>
            {projects.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
          </select>
        </div>

        <div className="space-y-2">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
            <UserCircle size={12} /> Point of Contact
          </label>
          <select 
            disabled={!selectedCompany}
            value={selectedContact}
            onChange={(e) => setSelectedContact(e.target.value)}
            className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-indigo-500/20 outline-none disabled:opacity-50"
          >
            <option value="">담당자 선택</option>
            {contacts.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
      </section>

      {/* 🎯 SPIN Discovery Grid */}
      <section className={clsx(
        "bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden transition-opacity duration-300",
        !selectedProject && "opacity-50 pointer-events-none"
      )}>
        <div className="bg-indigo-600 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2 text-white font-bold">
            <MessageSquare size={20} /> 
            <span>전략적 상담 질의 (Sales Discovery Grid)</span>
          </div>
          {!selectedProject && <span className="text-[10px] font-black text-indigo-200 uppercase tracking-widest">Select project to start</span>}
        </div>
        <div className="divide-y divide-slate-100">
          <InputGridRow 
            icon={<Search size={16} className="text-slate-400" />}
            category="Situation"
            question="현재 시스템의 사양과 주요 운영 환경은?"
            placeholder="CPU, 메모리, OS 버전 등 현재 하드웨어 현황 입력..."
          />
          <InputGridRow 
            icon={<AlertCircle size={16} className="text-rose-400" />}
            category="Problem"
            question="현재 솔루션의 가장 큰 기술적 제약이나 불만은?"
            placeholder="발열, 단가, 수급 이슈 등 구체적 페인 포인트 입력..."
          />
          <InputGridRow 
            icon={<Target size={16} className="text-amber-500" />}
            category="Implication"
            question="문제가 해결되지 않을 시 예상되는 리스크는?"
            placeholder="양산 지연 가능성, 경쟁력 약화, 비용 손실 등..."
          />
          <InputGridRow 
            icon={<Lightbulb size={16} className="text-emerald-500" />}
            category="Need-payoff"
            question="솔루션 도입 시 기대되는 정량적 효과는?"
            placeholder="성능 20% 향상, 단가 15% 절감 등 핵심 가치..."
          />
        </div>
      </section>

      {/* 🛠️ Technical Specs */}
      <div className={clsx(
        "grid grid-cols-1 md:grid-cols-2 gap-6 transition-opacity duration-300",
        !selectedProject && "opacity-50 pointer-events-none"
      )}>
        <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
          <div className="p-4 bg-slate-800 text-white flex items-center gap-2 font-bold text-xs uppercase tracking-widest">
            <Cpu size={16} /> Hardware VOC
          </div>
          <div className="p-6 space-y-5 bg-slate-50/30">
            <FormField label="CPU Core/Frequency" required placeholder="e.g. Quad-Core 1.8GHz" />
            <FormField label="Memory Layout" required placeholder="e.g. LPDDR4 4GB" />
            <FormField label="Main Interface" placeholder="e.g. MIPI-DSI, HDMI" />
          </div>
        </div>
        <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
          <div className="p-4 bg-slate-800 text-white flex items-center gap-2 font-bold text-xs uppercase tracking-widest">
            <ShieldCheck size={16} /> Environmental
          </div>
          <div className="p-6 space-y-5 bg-slate-50/30">
            <FormField label="Operating Temp" required placeholder="e.g. -40 ~ 85℃" />
            <FormField label="Power Supply" placeholder="e.g. DC 24V Input" />
            <FormField label="Safety Standards" placeholder="e.g. CE, AEC-Q100" />
          </div>
        </div>
      </div>
    </div>
  );
}
