import React, { useState, useEffect } from 'react';
import { Sparkles, MessageSquare, Copy, Check, TrendingUp } from 'lucide-react';
import { getTopStocks } from '../../services/stockService';
import type { Stock } from '../../types';
import { motion } from 'framer-motion';

export const IceBreakingPanel = ({ contactName }: { contactName?: string }) => {
  const [recommendations, setRecommendations] = useState<Stock[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const stocks = await getTopStocks();
        setRecommendations(stocks.slice(0, 2));
      } catch (err) {
        console.error('Failed to fetch recommendations:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const generateMessage = () => {
    if (recommendations.length === 0) return '';
    const stock = recommendations[0];
    return `안녕하세요 ${contactName || '담당자'}님! 오늘 MuzeStock에서 포착한 핫한 잠재력 종목 공유드립니다 📈

💎 종목: ${stock.name} (${stock.ticker})
🚀 DNA 스코어: ${stock.dnaScore}점
💡 한줄평: ${stock.relevantMetrics.recommendation || '강력한 모멘텀이 포착되었습니다.'}

미팅 전 가볍게 참고해 보세요!`;
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(generateMessage());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) return null;

  return (
    <div className="p-8 rounded-[40px] bg-gradient-to-br from-indigo-600/20 to-cyan-500/20 border border-white/10 shadow-2xl overflow-hidden relative group">
      <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform duration-700">
        <Sparkles className="w-24 h-24 text-cyan-400" />
      </div>

      <div className="relative z-10">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center text-cyan-400 backdrop-blur-md">
            <Sparkles className="w-5 h-5 fill-current" />
          </div>
          <div>
            <h3 className="text-lg font-black text-white tracking-tight">Ice-Breaking Signal</h3>
            <p className="text-[10px] text-cyan-400/80 font-black uppercase tracking-widest">MuzeStock Intelligence Integration</p>
          </div>
        </div>

        {recommendations.length > 0 && (
          <div className="space-y-4">
            <div className="p-4 rounded-3xl bg-black/40 border border-white/5 backdrop-blur-xl">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-black text-slate-500 uppercase">Today's Pick</span>
                <span className="flex items-center gap-1 text-[10px] font-mono font-bold text-emerald-400">
                  <TrendingUp className="w-3 h-3" />
                   {recommendations[0].changePercent > 0 ? '+' : ''}{recommendations[0].changePercent.toFixed(2)}%
                </span>
              </div>
              <h4 className="text-lg font-bold text-white leading-tight">{recommendations[0].name}</h4>
              <p className="text-xs text-slate-400 mt-1 font-medium">{recommendations[0].ticker} · DNA {recommendations[0].dnaScore}pts</p>
            </div>

            <div className="flex flex-col gap-3">
              <div className="p-4 rounded-2xl bg-white/5 border border-white/5 text-[11px] text-slate-300 leading-relaxed italic">
                "{generateMessage().split('\n').slice(0, 3).join('\n')}..."
              </div>
              
              <button 
                onClick={handleCopy}
                className={clsx(
                  "w-full py-3.5 rounded-2xl flex items-center justify-center gap-2 text-sm font-black tracking-tight transition-all active:scale-95",
                  copied 
                    ? "bg-emerald-500 text-white" 
                    : "bg-white text-slate-900 hover:bg-cyan-50 shadow-lg shadow-cyan-500/20"
                )}
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4" />
                    클립보드에 복사됨!
                  </>
                ) : (
                  <>
                    <MessageSquare className="w-4 h-4 fill-current" />
                    카카오톡 안부 메시지 생성
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const clsx = (...classes: string[]) => classes.filter(Boolean).join(' ');
