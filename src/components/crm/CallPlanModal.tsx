import { useState } from 'react';
import { 
  X, 
  History, 
  FileText, 
  Mic, 
  ShieldCheck, 
  Zap,
  AlertCircle,
  Search
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
  const [notes, setNotes] = useState('');

  const [currentQuestion, setCurrentQuestion] = useState('');
  const [currentAnswer, setCurrentAnswer] = useState('');
  const [similarLogs, setSimilarLogs] = useState<any[]>([]);

  if (!isOpen) return null;

  const handleSearchSimilar = async () => {
    if (!currentQuestion) return;
    setLoading(true);
    try {
      // In a real app, you'd get the embedding from OpenAI here
      // const embedding = await getEmbedding(currentQuestion);
      // const results = await searchSimilarTechLogs(embedding);
      // For demo, we'll mock it
      setSimilarLogs([
        { technical_log: [{ question: '유사 질문 서칭 결과...', answer: '과거에는 이렇게 응대했습니다.' }], similarity: 0.85 }
      ]);
    } catch (error) {
      console.error('Search failed:', error);
    } finally {
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
      <motion.div 
        initial={{ opacity: 0 }} 
        animate={{ opacity: 1 }} 
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-slate-950/80 backdrop-blur-md" 
      />
      
      <motion.div 
        initial={{ scale: 0.95, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        className="relative w-full max-w-4xl bg-slate-900 border border-slate-800 rounded-[32px] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="p-6 border-b border-slate-800 flex items-center justify-between bg-slate-900/50 backdrop-blur-xl">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-[0_0_15px_rgba(37,99,235,0.4)]">
              <Zap className="w-5 h-5 fill-current" />
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-100 flex items-center gap-2">
                Call Plan <span className="text-blue-500/50">Intelligence</span>
              </h2>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Active Meeting Mode</p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsQuickLog(!isQuickLog)}
              className={clsx(
                "px-3 py-1.5 rounded-lg border text-[10px] font-black uppercase tracking-widest transition-all focus:outline-none",
                isQuickLog ? "bg-orange-500/20 border-orange-500 text-orange-400" : "bg-slate-800 border-slate-700 text-slate-500"
              )}
            >
              {isQuickLog ? 'Quick Log Active' : 'Switch to Quick Log'}
            </button>
            <button onClick={onClose} className="p-2 hover:bg-slate-800 rounded-xl transition-colors">
              <X className="w-5 h-5 text-slate-500" />
            </button>
          </div>
        </div>

        {/* Navigation Steps */}
        {!isQuickLog && (
          <div className="flex px-6 pt-6 gap-2">
            {steps.map((s) => (
              <button
                key={s.id}
                onClick={() => setCurrentStep(s.id)}
                className={clsx(
                  "flex-1 py-2 text-[10px] font-bold uppercase tracking-widest rounded-lg border transition-all",
                  currentStep === s.id 
                    ? "bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-500/20" 
                    : "bg-slate-800/50 border-slate-700 text-slate-500 hover:text-slate-300"
                )}
              >
                {s.label.split('.')[1]}
              </button>
            ))}
          </div>
        )}

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
          <AnimatePresence mode="wait">
            {isQuickLog ? (
              <motion.div 
                key="quick"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="p-8 rounded-3xl bg-orange-500/5 border border-orange-500/20 text-center">
                  <Mic className="w-12 h-12 text-orange-400 mx-auto mb-4 animate-pulse" />
                  <h3 className="text-xl font-bold text-slate-100 mb-2">Mobile Quick Log Mode</h3>
                  <p className="text-slate-400 text-sm">미팅 직후 핵심 니즈와 다음 액션만 빠르게 기록하세요.</p>
                </div>
                <textarea 
                  className="w-full h-48 bg-slate-950 border border-slate-800 rounded-2xl p-4 text-slate-200 focus:outline-none focus:border-orange-500/50 transition-colors"
                  placeholder="예: A사 센서 납기 이슈로 인해 당사 샘플 5개 테스트 요청함. 다음주 중 방문 예정..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </motion.div>
            ) : (
              <div key="stepped">
                {currentStep === 'PRECHECK' && (
                  <div className="space-y-6">
                    <div className="flex items-center gap-2 mb-2">
                      <ShieldCheck className="w-5 h-5 text-emerald-400" />
                      <h3 className="text-lg font-bold text-slate-100">미팅 전 체크리스트</h3>
                    </div>
                    <div className="space-y-3">
                      {checklist.map((item: string, i: number) => (
                        <div key={i} className="flex items-center gap-3 p-4 rounded-xl bg-slate-800/30 border border-slate-700/50">
                          <input 
                            type="checkbox" 
                            checked={checkedItems[i] || false}
                            onChange={() => setCheckedItems({...checkedItems, [i]: !checkedItems[i]})}
                            className="w-4 h-4 rounded border-slate-700 text-blue-600 focus:ring-blue-500 bg-slate-950"
                          />
                          <span className={clsx("text-sm transition-opacity", checkedItems[i] ? "text-slate-500 line-through" : "text-slate-300")}>
                            {item}
                          </span>
                        </div>
                      ))}
                    </div>
                    <div className="p-6 rounded-2xl bg-blue-950/20 border border-blue-500/20">
                      <p className="text-xs text-blue-400 font-bold mb-2 uppercase tracking-widest">Ice-Breaking Tool Integration</p>
                      <button className="text-sm font-bold text-slate-100 hover:text-blue-400 transition-colors flex items-center gap-2">
                        < Zap className="w-4 h-4" /> 오늘 추천 주식 메시지 미리 생성하기
                      </button>
                    </div>
                  </div>
                )}

                {currentStep === 'TECHNICAL' && (
                  <div className="space-y-6">
                    <div className="flex items-center gap-2 mb-2">
                      <History className="w-5 h-5 text-purple-400" />
                      <h3 className="text-lg font-bold text-slate-100">Technical Log & Vector Search</h3>
                    </div>
                    
                    <div className="space-y-4">
                      <div>
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-2">Technical Question</label>
                        <div className="flex gap-2">
                          <input 
                            className="flex-1 bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-slate-200"
                            placeholder="고객의 기술적 질문을 입력하세요..."
                            value={currentQuestion}
                            onChange={(e) => setCurrentQuestion(e.target.value)}
                          />
                          <button 
                            onClick={handleSearchSimilar}
                            disabled={loading}
                            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-sm font-bold flex items-center gap-2"
                          >
                            <Search className="w-4 h-4" />
                            과거 대응 검색
                          </button>
                        </div>
                      </div>

                      {similarLogs.length > 0 && (
                        <div className="p-4 rounded-xl bg-indigo-500/5 border border-indigo-500/20 animate-in fade-in duration-500">
                          <div className="flex items-center gap-2 mb-3 text-[10px] font-black text-indigo-400 uppercase tracking-widest">
                            <Zap className="w-3 h-3 fill-current" /> Best Match from History (85%)
                          </div>
                          <p className="text-xs text-slate-400 mb-2 italic">"{similarLogs[0].technical_log[0].question}"</p>
                          <p className="text-sm text-slate-200 font-bold">"{similarLogs[0].technical_log[0].answer}"</p>
                        </div>
                      )}

                      <textarea 
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-slate-200 h-24"
                        placeholder="이번 미팅에서의 답변 내용을 기록하세요..."
                        value={currentAnswer}
                        onChange={(e) => setCurrentAnswer(e.target.value)}
                      />
                      
                      <button 
                        onClick={() => {
                          if (currentQuestion && currentAnswer) {
                            setTechnicalLogs([...technicalLogs, { question: currentQuestion, answer: currentAnswer, date: new Date().toISOString() }]);
                            setCurrentQuestion('');
                            setCurrentAnswer('');
                          }
                        }}
                        className="w-full py-2 bg-blue-600/50 hover:bg-blue-600 text-white rounded-xl text-xs font-black uppercase tracking-widest transition-all"
                      >
                        로그 추가하기
                      </button>
                    </div>
                  </div>
                )}

                {currentStep === 'SOURCING' && (
                  <div className="space-y-6">
                    <div className="flex items-center gap-2 mb-2">
                      < Zap className="w-5 h-5 text-cyan-400" />
                      <h3 className="text-lg font-bold text-slate-100">Smart Sourcing Bridge</h3>
                    </div>
                    <p className="text-xs text-slate-400">현장에서 고객이 언급한 희귀 부품의 재고를 Rare Source 엔진으로 즉시 스캔합니다.</p>
                    
                    <div className="flex gap-2">
                      <input 
                        className="flex-1 bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-slate-200"
                        placeholder="부품 번호 입력 (예: STM32F405...)"
                      />
                      <button className="px-6 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl text-sm font-bold">스캔 시작</button>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-4 rounded-xl bg-slate-800/30 border border-slate-700/50 flex flex-col items-center justify-center text-center opacity-50">
                        <AlertCircle className="w-5 h-5 text-slate-500 mb-2" />
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest font-mono">No Active Scan</p>
                      </div>
                    </div>
                  </div>
                )}

                {currentStep === 'LOGIC' && (
                  <div className="space-y-6">
                    <div className="flex items-center gap-2 mb-2">
                      <FileText className="w-5 h-5 text-amber-400" />
                      <h3 className="text-lg font-bold text-slate-100">최종 미팅 기록</h3>
                    </div>
                    <textarea 
                      className="w-full h-48 bg-slate-950 border border-slate-800 rounded-2xl p-4 text-slate-200 focus:outline-none focus:border-blue-500/50 transition-colors"
                      placeholder="기타 특이사항이나 상세 회의록을 입력하세요..."
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                    />
                  </div>
                )}
              </div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-slate-800 flex justify-between bg-slate-900/50 backdrop-blur-xl">
          <button 
            disabled={currentStep === 'PRECHECK' && !isQuickLog}
            onClick={() => {
              const prev: Record<Step, Step> = { PRECHECK: 'PRECHECK', DISCOVERY: 'PRECHECK', TECHNICAL: 'DISCOVERY', SOURCING: 'TECHNICAL', LOGIC: 'SOURCING' };
              setCurrentStep(prev[currentStep]);
            }}
            className="px-6 py-2 text-slate-400 hover:text-slate-200 text-sm font-bold flex items-center gap-2 disabled:opacity-30"
          >
            이전
          </button>
          
          <button 
            onClick={currentStep === 'LOGIC' || isQuickLog ? handleCreateCallPlan : () => {
              const next: Record<Step, Step> = { PRECHECK: 'DISCOVERY', DISCOVERY: 'TECHNICAL', TECHNICAL: 'SOURCING', SOURCING: 'LOGIC', LOGIC: 'LOGIC' };
              setCurrentStep(next[currentStep]);
            }}
            className="px-8 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-bold shadow-lg shadow-blue-500/20 flex items-center gap-2 transition-all hover:scale-105 active:scale-95"
          >
            {currentStep === 'LOGIC' || isQuickLog ? '미팅 종료 및 저장' : '다음 단계로'}
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </motion.div>
    </div>
  );
};

const ArrowRight = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
  </svg>
);
