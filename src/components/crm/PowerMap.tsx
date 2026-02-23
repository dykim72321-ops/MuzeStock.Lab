import React, { useEffect, useState } from 'react';
import { Network, UserCircle2, ShieldCheck, ShieldAlert, Info } from 'lucide-react';
import type { CrmContact } from '../../types/crm';
import { getCrmContacts } from '../../services/crmService';
import clsx from 'clsx';
import { motion } from 'framer-motion';

export const PowerMap = ({ companyId }: { companyId?: string }) => {
  const [contacts, setContacts] = useState<CrmContact[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await getCrmContacts(companyId);
        setContacts(data);
      } catch (error) {
        console.error('Failed to fetch contacts for PowerMap:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [companyId]);

  const groups = {
    CHAMPION: contacts.filter(c => c.influence_level === 'CHAMPION'),
    INFLUENCER: contacts.filter(c => c.influence_level === 'INFLUENCER'),
    BLOCKER: contacts.filter(c => c.influence_level === 'BLOCKER'),
    USER: contacts.filter(c => c.influence_level === 'USER'),
  };

  if (loading) return null;

  return (
    <div className="p-6 rounded-[32px] bg-slate-900 border border-slate-800 shadow-2xl">
      <div className="flex items-center justify-between mb-8">
        <h3 className="text-sm font-black text-slate-100 uppercase tracking-widest flex items-center gap-2">
          <Network className="w-4 h-4 text-blue-500" />
          Influence Power Map
        </h3>
        <div className="flex gap-4">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"></span>
            <span className="text-[10px] font-bold text-slate-500">CHAMPION</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.5)]"></span>
            <span className="text-[10px] font-bold text-slate-500">BLOCKER</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-8 relative">
        {/* Connection Lines (Stylized) */}
        <div className="absolute inset-0 flex items-center justify-center opacity-10 pointer-events-none">
          <div className="w-full h-[1px] bg-gradient-to-r from-transparent via-slate-400 to-transparent"></div>
          <div className="h-full w-[1px] bg-gradient-to-b from-transparent via-slate-400 to-transparent absolute"></div>
        </div>

        {/* Decision Makers / Champions */}
        <div className="space-y-4">
          <h4 className="text-[9px] font-black text-emerald-500/70 uppercase tracking-widest mb-2 px-2">Decision Makers (ア軍)</h4>
          <div className="flex flex-wrap gap-3">
            {groups.CHAMPION.map(c => (
              <motion.div 
                whileHover={{ scale: 1.05 }}
                key={c.id} 
                className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center gap-3 pr-5"
              >
                <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-100">{c.name}</p>
                  <p className="text-[9px] text-emerald-400/70 font-bold">{c.position}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Potential Blockers */}
        <div className="space-y-4">
          <h4 className="text-[9px] font-black text-rose-500/70 uppercase tracking-widest mb-2 px-2">Risks & Blockers (警戒)</h4>
          <div className="flex flex-wrap gap-3">
            {groups.BLOCKER.map(c => (
              <motion.div 
                whileHover={{ scale: 1.05 }}
                key={c.id} 
                className="p-3 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center gap-3 pr-5"
              >
                <div className="w-8 h-8 rounded-full bg-rose-500/20 flex items-center justify-center text-rose-400">
                  <ShieldAlert className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-100">{c.name}</p>
                  <p className="text-[9px] text-rose-400/70 font-bold">{c.position}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Influencers */}
        <div className="space-y-4">
          <h4 className="text-[9px] font-black text-blue-500/70 uppercase tracking-widest mb-2 px-2">Influencers</h4>
          <div className="flex flex-wrap gap-3">
            {groups.INFLUENCER.map(c => (
              <div key={c.id} className="p-3 rounded-2xl bg-blue-500/10 border border-blue-500/30 flex items-center gap-3 pr-5">
                <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400">
                  <UserCircle2 className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-100">{c.name}</p>
                  <p className="text-[9px] text-blue-400/70 font-bold">{c.position}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <h4 className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-2 px-2">End Users</h4>
          <div className="flex flex-wrap gap-3">
            {groups.USER.map(c => (
              <div key={c.id} className="p-3 rounded-2xl bg-slate-800/50 border border-slate-700/50 flex items-center gap-3 pr-5">
                <div className="w-8 h-8 rounded-full bg-slate-700/50 flex items-center justify-center text-slate-500">
                  <UserCircle2 className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-300">{c.name}</p>
                  <p className="text-[9px] text-slate-500 font-bold">{c.position}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-8 p-4 rounded-2xl bg-slate-950 border border-slate-800/50 flex items-start gap-3">
        <Info className="w-4 h-4 text-blue-500 mt-0.5 shrink-0" />
        <p className="text-[10px] text-slate-500 leading-relaxed indent-[-4px] ml-1">
          ※ CHAMPION은 영업 성사를 돕는 내부 조력자이며, BLOCKER는 기술 규격이나 예산 문제로 진행을 저해할 가능성이 높은 인물입니다. INFLUENCER를 활용하여 BLOCKER의 부정적 견해를 상쇄하는 전략이 권장됩니다.
        </p>
      </div>
    </div>
  );
};
