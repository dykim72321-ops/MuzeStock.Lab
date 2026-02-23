import React from 'react';
import { CheckCircle2, Factory, Link2, ExternalLink } from 'lucide-react';
import { motion } from 'framer-motion';

const MOCK_DESIGN_INS = [
  { 
    id: '1', 
    company: 'Alpha Robotics', 
    part: 'STM32H753', 
    application: '협동 로봇 메인 컨트롤러',
    status: 'DESIGNED_IN',
    benefit: '납기 안정성 확보 및 원가 15% 절감'
  },
  { 
    id: '2', 
    company: 'Beta Systems', 
    part: 'IMXRT1062', 
    application: '산업용 HMI 게이트웨이',
    status: 'PROTOTYPE',
    benefit: '기존 DSP 대비 처리 속도 2배 향상'
  }
];

export const DesignInShowcase = () => {
  return (
    <div className="p-6 rounded-[32px] bg-slate-900 border border-slate-800 h-full">
      <h3 className="text-sm font-black text-slate-100 uppercase tracking-widest flex items-center gap-2 mb-6">
        <CheckCircle2 className="w-4 h-4 text-emerald-500" />
        Design-in Success Showcase
      </h3>

      <div className="space-y-4">
        {MOCK_DESIGN_INS.map((item, i) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.1 }}
            className="p-4 rounded-2xl bg-slate-800/30 border border-slate-700/50 hover:bg-slate-800/50 hover:border-emerald-500/30 transition-all group"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Factory className="w-3 h-3 text-slate-500" />
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">{item.company}</span>
              </div>
              <span className={clsx(
                "px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest border",
                item.status === 'DESIGNED_IN' ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : "bg-blue-500/10 text-blue-400 border-blue-500/20"
              )}>
                {item.status}
              </span>
            </div>

            <h4 className="text-sm font-bold text-slate-200 group-hover:text-emerald-400 transition-colors">
              {item.part} 적용 사례
            </h4>
            <p className="text-[11px] text-slate-400 mt-1">{item.application}</p>
            
            <div className="mt-4 flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-[9px] font-bold text-emerald-400/80">
                <Link2 className="w-3 h-3" />
                {item.benefit}
              </div>
              <ExternalLink className="w-3 h-3 text-slate-600 group-hover:text-blue-400 transition-colors" />
            </div>
          </motion.div>
        ))}
      </div>

      <button className="w-full mt-6 py-2.5 bg-slate-950 hover:bg-slate-800 text-[10px] font-black text-slate-500 hover:text-slate-300 uppercase tracking-[0.2em] rounded-xl transition-all border border-slate-800">
        View All References
      </button>
    </div>
  );
};

const clsx = (...classes: string[]) => classes.filter(Boolean).join(' ');
