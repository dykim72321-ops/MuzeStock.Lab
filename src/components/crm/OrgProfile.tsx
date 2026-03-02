import React from 'react';

interface OrgProfileProps {
  name: string;
  role: string;
  desc: string;
}

export const OrgProfile = ({ name, role, desc }: OrgProfileProps) => (
  <div className="flex flex-col items-center">
    <div className="w-16 h-16 bg-slate-900 rounded-2xl mb-4 flex items-center justify-center text-white font-black text-xl shadow-xl border-2 border-indigo-500/20 rotate-3 hover:rotate-0 transition-transform">
      {name[0]}
    </div>
    <span className="text-[9px] font-black text-indigo-500 uppercase tracking-[0.2em] mb-1">{role}</span>
    <p className="text-base font-black text-slate-800">{name}</p>
    <p className="text-[11px] text-slate-400 mt-1 max-w-[160px] leading-relaxed text-center">{desc}</p>
  </div>
);
