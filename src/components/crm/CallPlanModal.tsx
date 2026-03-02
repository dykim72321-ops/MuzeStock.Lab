import { useState } from 'react';
import { 
  X, 
  History, 
  FileText, 
  Mic, 
  ShieldCheck, 
  Zap,
  AlertCircle,
  Search,
  CheckCircle2,
  Globe,
  Plus,
  ArrowRight
} from 'lucide-react';
import { createCallPlan } from '../../services/crmService';
import type { CallPlan, TechnicalLogItem } from '../../types/crm';
import clsx from 'clsx';
import { motion, AnimatePresence } from 'framer-motion';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  companyId: string;
  contactId: string;
}

type Step = 'PRECHECK' | 'DISCOVERY' | 'TECHNICAL' | 'SOURCING' | 'LOGIC';

export const CallPlanModal = ({ isOpen, onClose, companyId, contactId }: Props) => {
  const [currentStep, setCurrentStep] = useState<Step>('PRECHECK');
  const [isQuickLog, setIsQuickLog] = useState(false);
  const [loading, setLoading] = useState(false);

  // Form State
  const [technicalLogs, setTechnicalLogs] = useState<TechnicalLogItem[]>([]);
  const [checklist] = useState<string[]>([
    '아이스브레이킹 주식 정보 준비 완료',
    '경쟁사 제품 대비 우위 포인트 숙지',
    '고객사 과거 미팅 히스토리 검토'
  ]);
  const [checkedItems, setCheckedItems] = useState<Record<number, boolean>>({});
  
  // Discovery State
  const [currentUsage, setCurrentUsage] = useState('');
  const [painPoints, setPainPoints] = useState('');
  
  const [notes, setNotes] = useState('');

  // Tech Log State
  const [currentQuestion, setCurrentQuestion] = useState('');
  const [currentAnswer, setCurrentAnswer] = useState('');
  const [similarLogs, setSimilarLogs] = useState<any[]>([]);

  if (!isOpen) return null;

  const handleSearchSimilar = async () => {
    if (!currentQuestion) return;
    setLoading(true);
    try {
      // pgvector 기반 유사도 검색 연동
      setTimeout(() => {
        setSimilarLogs([
          { technical_log: [{ question: '기존 센서 대신 호환이 완벽하게 되나요?', answer: '네, 핀맵이 100% 일치하며 지난달 A사 라인에도 성공적으로 Design-in 되었습니다.' }], similarity: 0.92 }
        ]);
        setLoading(false);
      }, 800);
    } catch (error) {
      console.error('Search failed:', error);
      setLoading(false);
    }
  };

  const handleCreateCallPlan = async () => {
    try {
      const plan: Partial<CallPlan> = {
        company_id: companyId,
        contact_id: contactId,
        visit_date: new Date().toISOString(),
        technical_log: technicalLogs,
        checklist: checklist.filter((_: string, i: number) => checkedItems[i]),
        notes: notes,
        is_quick_log: isQuickLog,
      };
      await createCallPlan(plan);
      onClose();
    } catch (error) {
      console.error('Save failed:', error);
    }
  };

  const steps: { id: Step; label: string }[] = [
    { id: 'PRECHECK', label: '1. 사전준비' },
    { id: 'DISCOVERY', label: '2. 니즈발굴' },
    { id: 'TECHNICAL', label: '3. 기술상담' },
    { id: 'SOURCING', label: '4. 즉석소싱' },
    { id: 'LOGIC', label: '5. 최종기록' },
  ];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Light Backdrop */}
      <motion.div 
        initial={{ opacity: 0 }} 
        animate={{ opacity: 1 }} 
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" 
      />
      
      {/* Modal Container */}
      <motion.div 
        initial={{ scale: 0.95, opacity: 0, y: 10 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        className="relative w-full max-w-4xl bg-white border border-slate-200 rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] font-sans"
      >
        {/* 🚀 Header */}
        <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-white">
          <div className="flex items-center gap-4">
            <div className="p-2.5 rounded-lg bg-[#0176d3] shadow-md">
              <Zap className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-900 leading-tight">
                Call Plan <span className="text-slate-400 font-bold ml-1">/ Meeting Dashboard</span>
              </h2>
              <div className="flex items-center gap-2 mt-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-sm animate-pulse"></span>
                <p className="text-xs text-emerald-600 font-black uppercase tracking-widest">Active Intelligence Mode</p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button 
              onClick={() => setIsQuickLog(!isQuickLog)}
              className={clsx(
                "px-4 py-2 rounded-md border text-xs font-black uppercase tracking-tight transition-all flex items-center gap-2",
                isQuickLog 
                  ? "bg-amber-50 border-amber-200 text-amber-700 shadow-inner" 
                  : "bg-white border-slate-300 text-slate-600 hover:bg-slate-50 shadow-sm"
              )}
            >
              <Mic className="w-4 h-4" />
              {isQuickLog ? 'Mobile Quick Mode ON' : 'Switch to Quick Log'}
            </button>
            <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* 🗺️ Salesforce Style Stepper */}
        {!isQuickLog && (
          <div className="flex bg-slate-50 px-8 py-4 border-b border-slate-200 overflow-x-auto no-scrollbar">
            {steps.map((s, idx) => {
              const isCurrent = currentStep === s.id;
              const isPast = steps.findIndex(step => step.id === currentStep) > idx;

              return (
                <div key={s.id} className="flex items-center flex-1 last:flex-none">
                  <button
                    onClick={() => setCurrentStep(s.id)}
                    className={clsx(
                      "group flex flex-col md:flex-row items-center gap-3 transition-all",
                      isCurrent || isPast ? "cursor-pointer" : "cursor-default"
                    )}
                  >
                    <div className={clsx(
                      "w-8 h-8 rounded-full flex items-center justify-center text-xs font-black transition-all border-2",
                      isCurrent ? "bg-[#0176d3] border-[#0176d3] text-white shadow-md scale-110" :
                      isPast ? "bg-white border-[#0176d3] text-[#0176d3]" :
                      "bg-white border-slate-300 text-slate-400"
                    )}>
                      {isPast ? <CheckCircle2 className="w-4 h-4" /> : idx + 1}
                    </div>
                    <span className={clsx(
                      "text-xs font-black uppercase tracking-widest hidden md:block whitespace-nowrap",
                      isCurrent ? "text-[#0176d3]" : isPast ? "text-slate-700" : "text-slate-400"
                    )}>
                      {s.label.split('. ')[1]}
                    </span>
                  </button>
                  {idx < steps.length - 1 && (
                    <div className={clsx(
                        "stepper-line",
                        isPast ? "bg-[#0176d3]" : "bg-slate-300"
                    )}></div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* 📝 Content Area */}
        <div className="flex-1 overflow-y-auto p-8 bg-white no-scrollbar">
          <AnimatePresence mode="wait">
            {isQuickLog ? (
              <motion.div 
                key="quick"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="max-w-2xl mx-auto space-y-6"
              >
                <div className="p-8 rounded-2xl bg-amber-50 border border-amber-200 text-center shadow-inner">
                  <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4 border border-amber-200">
                    <Mic className="w-8 h-8 text-amber-600" />
                  </div>
                  <h3 className="text-xl font-black text-slate-900 mb-2 uppercase tracking-tight">Mobile Quick Log Mode</h3>
                  <p className="text-slate-600 font-medium leading-relaxed">
                    미팅 직후 핵심 니즈와 다음 액션만 빠르게 기록하세요.<br/>
                    저장 후 CRM 대시보드에서 상세 내용을 보완할 수 있습니다.
                  </p>
                </div>
                <div>
                  <label className="sfdc-label uppercase tracking-widest text-[11px]">빠른 미팅 메모 (Meeting Summary)</label>
                  <textarea 
                    className="sfdc-input h-64 text-base leading-relaxed"
                    placeholder="예: STM32 납기 이슈 확인. 당사 샘플 10개 테스트 요청됨. 다음주 화요일 2차 미팅 예정..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                  />
                </div>
              </motion.div>
            ) : (
              <div key="stepped" className="max-w-3xl mx-auto">
                
                {/* 1. PRECHECK */}
                {currentStep === 'PRECHECK' && (
                  <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
                    <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
                      <ShieldCheck className="w-7 h-7 text-emerald-600" />
                      <div>
                        <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight">Meeting Readiness</h3>
                        <p className="text-sm text-slate-500 font-medium font-mono">STEP 01 / CRM PRE-FLIGHT CHECKLIST</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 gap-3">
                      {checklist.map((item: string, i: number) => (
                        <label key={i} className={clsx(
                            "flex items-center gap-4 p-5 rounded-xl border transition-all cursor-pointer group",
                            checkedItems[i] ? "bg-slate-50 border-slate-100" : "bg-white border-slate-200 hover:border-[#0176d3] hover:shadow-md"
                        )}>
                          <div className="relative flex items-center justify-center">
                            <input 
                                type="checkbox" 
                                checked={checkedItems[i] || false}
                                onChange={() => setCheckedItems({...checkedItems, [i]: !checkedItems[i]})}
                                className="w-6 h-6 rounded-md border-slate-300 text-[#0176d3] focus:ring-[#0176d3] transition-all"
                            />
                          </div>
                          <span className={clsx(
                              "text-base font-bold transition-all",
                              checkedItems[i] ? "text-slate-400 line-through" : "text-slate-700"
                          )}>
                            {item}
                          </span>
                        </label>
                      ))}
                    </div>
                    
                    <div className="p-6 rounded-2xl bg-[#0176d3]/5 border border-[#0176d3]/20 flex items-start gap-5">
                      <div className="p-3 bg-white rounded-xl shadow-sm border border-[#0176d3]/10">
                        <Zap className="w-6 h-6 text-[#0176d3]" />
                      </div>
                      <div className="flex-1">
                        <h4 className="text-base font-black text-slate-900 uppercase tracking-tight">AI Ice-Breaker Generator</h4>
                        <p className="text-sm text-slate-600 mt-1 font-medium leading-relaxed">MuzeStock 퀀트 엔진의 실시간 데이터를 기반으로 고객의 관심사에 맞춘 대화 주제를 생성합니다.</p>
                        <button className="sfdc-button-primary mt-4 py-2 px-6">
                          전략 메시지 생성하기
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* 2. DISCOVERY */}
                {currentStep === 'DISCOVERY' && (
                  <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
                    <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
                      <Search className="w-7 h-7 text-[#0176d3]" />
                      <div>
                        <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight">Customer Discovery</h3>
                        <p className="text-sm text-slate-500 font-medium font-mono">STEP 02 / PAIN POINTS & OPPORTUNITIES</p>
                      </div>
                    </div>
                    
                    <div className="space-y-6">
                      <div>
                        <label className="sfdc-label uppercase tracking-widest text-[11px]">현재 사용 현황 (Current Usage)</label>
                        <textarea 
                          className="sfdc-input h-32 text-base"
                          placeholder="현재 어떤 장비에 어떤 부품을 메인으로 사용 중이며, 경쟁사 비중은 어느 정도입니까?"
                          value={currentUsage}
                          onChange={(e) => setCurrentUsage(e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="sfdc-label uppercase tracking-widest text-[11px]">불편사항 및 핵심 니즈 (Pain Points)</label>
                        <textarea 
                          className="sfdc-input h-32 text-base"
                          placeholder="고객이 겪고 있는 납기, 단가, 기술적 한계 또는 퀀트 데이터 기반의 우려 사항을 기록하세요."
                          value={painPoints}
                          onChange={(e) => setPainPoints(e.target.value)}
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* 3. TECHNICAL */}
                {currentStep === 'TECHNICAL' && (
                  <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
                    <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                      <div className="flex items-center gap-3">
                        <History className="w-7 h-7 text-purple-600" />
                        <div>
                          <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight">Technical Advisory</h3>
                          <p className="text-sm text-slate-500 font-medium font-mono">STEP 03 / VECTOR SEARCH ENABLED</p>
                        </div>
                      </div>
                      <span className="text-[10px] font-black text-purple-700 bg-purple-50 border border-purple-200 px-3 py-1 rounded-full uppercase tracking-widest shadow-sm">AI Engine Active</span>
                    </div>
                    
                    <div className="p-6 rounded-2xl border border-slate-200 bg-slate-50/50 space-y-6 shadow-inner">
                      <div>
                        <label className="sfdc-label text-slate-500 uppercase tracking-widest text-[10px]">Customer Question (Technical)</label>
                        <div className="flex gap-3">
                          <input 
                            className="sfdc-input flex-1 text-base py-3"
                            placeholder="기술적 질문 또는 데이터 피드백을 입력하세요..."
                            value={currentQuestion}
                            onChange={(e) => setCurrentQuestion(e.target.value)}
                          />
                          <button 
                            onClick={handleSearchSimilar}
                            disabled={loading || !currentQuestion}
                            className="sfdc-button-primary flex items-center gap-2 min-w-[140px] justify-center"
                          >
                            {loading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : <Search className="w-4 h-4" />}
                            AI 검색
                          </button>
                        </div>
                      </div>

                      {similarLogs.length > 0 && (
                        <div className="p-5 rounded-xl bg-white border border-purple-200 shadow-md animate-in zoom-in-95 duration-200">
                          <div className="flex items-center gap-2 mb-3 text-xs font-black text-purple-700 uppercase tracking-widest">
                            <CheckCircle2 className="w-4 h-4 text-purple-600" /> Most Relevant Technical Response (92%)
                          </div>
                          <p className="text-sm text-slate-500 mb-2 border-l-4 border-slate-200 pl-3 italic font-medium">"Q. {similarLogs[0].technical_log[0].question}"</p>
                          <p className="text-base font-bold text-slate-900 border-l-4 border-purple-500 pl-3 leading-relaxed">"A. {similarLogs[0].technical_log[0].answer}"</p>
                        </div>
                      )}

                      <div>
                        <label className="sfdc-label text-slate-500 uppercase tracking-widest text-[10px]">Your Strategic Response</label>
                        <textarea 
                          className="sfdc-input h-28 text-base bg-white"
                          placeholder="실제 고객에게 답변한 내용을 정문화하여 기록하세요. 이는 향후 AI 지식 베이스가 됩니다."
                          value={currentAnswer}
                          onChange={(e) => setCurrentAnswer(e.target.value)}
                        />
                      </div>
                      
                      <button 
                        onClick={() => {
                          if (currentQuestion && currentAnswer) {
                            setTechnicalLogs([...technicalLogs, { question: currentQuestion, answer: currentAnswer, date: new Date().toISOString() }]);
                            setCurrentQuestion('');
                            setCurrentAnswer('');
                            setSimilarLogs([]);
                          }
                        }}
                        className="w-full sfdc-button-secondary py-3 text-base flex items-center justify-center gap-2"
                      >
                        <Plus className="w-5 h-5" />
                        기술 로그에 정문화 기록하기
                      </button>
                    </div>

                    {/* 쌓인 로그 표시 */}
                    {technicalLogs.length > 0 && (
                      <div className="space-y-3">
                        <p className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Recorded Technical Logs ({technicalLogs.length})</p>
                        {technicalLogs.map((log, idx) => (
                          <div key={idx} className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm flex flex-col gap-2">
                            <div className="flex gap-3">
                                <span className="text-[#0176d3] font-black text-sm">Q.</span>
                                <p className="font-bold text-slate-800 text-sm">{log.question}</p>
                            </div>
                            <div className="flex gap-3 pt-2 border-t border-slate-50">
                                <span className="text-slate-400 font-black text-sm">A.</span>
                                <p className="text-slate-600 text-sm font-medium leading-relaxed">{log.answer}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* 4. SOURCING */}
                {currentStep === 'SOURCING' && (
                  <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
                    <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
                      <Globe className="w-7 h-7 text-blue-600" />
                      <div>
                        <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight">Supply Chain Discovery</h3>
                        <p className="text-sm text-slate-500 font-medium font-mono">STEP 04 / GLOBAL RARE SOURCE SCAN</p>
                      </div>
                    </div>
                    <p className="text-base text-slate-600 font-medium leading-relaxed">현장에서 언급된 부품Part Number)을 즉시 스캔하여 글로벌 재고 상황과 단종 리스크를 정량화합니다.</p>
                    
                    <div className="flex gap-3">
                      <div className="relative flex-1">
                        <Search className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
                        <input 
                          className="sfdc-input pl-12 py-3.5 text-base"
                          placeholder="부품 번호를 입력하세요 (예: STM32F405VT...)"
                        />
                      </div>
                      <button className="sfdc-button-primary px-8 flex items-center gap-2">
                        <Zap className="w-5 h-5" />
                        글로벌 스캔
                      </button>
                    </div>

                    <div className="p-12 rounded-2xl bg-slate-50 border-2 border-dashed border-slate-200 flex flex-col items-center justify-center text-center">
                      <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm mb-4">
                        <AlertCircle className="w-6 h-6 text-slate-300" />
                      </div>
                      <p className="text-lg font-bold text-slate-400">Scan Waiting...</p>
                      <p className="text-sm text-slate-400 mt-1 font-medium italic">부품 정보를 입력하고 스캔을 시작하면 실시간 수급 데이터가 표시됩니다.</p>
                    </div>
                  </div>
                )}

                {/* 5. LOGIC */}
                {currentStep === 'LOGIC' && (
                  <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
                    <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
                      <FileText className="w-7 h-7 text-amber-600" />
                      <div>
                        <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight">Final Synthesis</h3>
                        <p className="text-sm text-slate-500 font-medium font-mono">STEP 05 / EXECUTIVE SUMMARY & NEXT ACTION</p>
                      </div>
                    </div>
                    
                    <div className="space-y-6">
                      <div>
                        <label className="sfdc-label uppercase tracking-widest text-[11px]">미팅 상세 메모 및 다음 액션 (Executive Notes)</label>
                        <textarea 
                          className="sfdc-input h-56 text-base leading-relaxed"
                          placeholder="미팅 전반적인 분위기, 의사결정권자의 의중, 차기 미팅 일정 및 준비 사항을 구체적으로 기록하세요."
                          value={notes}
                          onChange={(e) => setNotes(e.target.value)}
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </AnimatePresence>
        </div>

        {/* 🏁 Footer Actions */}
        <div className="p-6 border-t border-slate-100 bg-slate-50/80 flex justify-between items-center rounded-b-xl">
          <button 
            disabled={currentStep === 'PRECHECK' && !isQuickLog}
            onClick={() => {
              const prev: Record<Step, Step> = { PRECHECK: 'PRECHECK', DISCOVERY: 'PRECHECK', TECHNICAL: 'DISCOVERY', SOURCING: 'TECHNICAL', LOGIC: 'SOURCING' };
              setCurrentStep(prev[currentStep]);
            }}
            className="sfdc-button-secondary py-2 px-8 flex items-center gap-2 group disabled:opacity-30"
          >
            <div className="rotate-180 transition-transform group-hover:-translate-x-1">
                <ArrowRight className="w-4 h-4" />
            </div>
            PREVIOUS STEP
          </button>
          
          <button 
            onClick={currentStep === 'LOGIC' || isQuickLog ? handleCreateCallPlan : () => {
              const next: Record<Step, Step> = { PRECHECK: 'DISCOVERY', DISCOVERY: 'TECHNICAL', TECHNICAL: 'SOURCING', SOURCING: 'LOGIC', LOGIC: 'LOGIC' };
              setCurrentStep(next[currentStep]);
            }}
            className={clsx(
              "sfdc-button-primary py-2 px-10 flex items-center gap-3 text-base group transition-all",
              currentStep === 'LOGIC' || isQuickLog
                ? "bg-emerald-600 hover:bg-emerald-700 shadow-emerald-200"
                : ""
            )}
          >
            {currentStep === 'LOGIC' || isQuickLog ? (
              <>
                <CheckCircle2 className="w-5 h-5 shadow-sm" />
                COMPLETE & SAVE MISSION
              </>
            ) : (
              <>
                NEXT INTELLIGENCE STEP
                <div className="transition-transform group-hover:translate-x-1">
                    <ArrowRight className="w-5 h-5" />
                </div>
              </>
            )}
          </button>
        </div>
      </motion.div>
    </div>
  );
};