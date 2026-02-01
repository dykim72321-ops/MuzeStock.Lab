import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowUpRight, ArrowDownRight, Search, Loader2, RefreshCw } from 'lucide-react';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { getTopStocks } from '../../services/stockService';
import { MOCK_STOCKS } from '../../data/mockData';
import type { Stock } from '../../types';
import clsx from 'clsx';

export const StockScreener = () => {
  const navigate = useNavigate();
  const [stocks, setStocks] = useState<Stock[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchStocks = async () => {
    try {
      setLoading(true);
      const data = await getTopStocks();
      if (data.length > 0) {
        setStocks(data);
      } else {
        setStocks(MOCK_STOCKS);
      }
    } catch (err) {
      console.error('Failed to fetch stocks:', err);
      setStocks(MOCK_STOCKS);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStocks();
  }, []);

  const filteredStocks = stocks.filter(
    (stock) =>
      stock.ticker.toLowerCase().includes(searchTerm.toLowerCase()) ||
      stock.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
             <span className="px-2 py-0.5 rounded text-xs font-bold bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
               STEP 1: DISCOVERY
             </span>
             <span className="px-2 py-0.5 rounded text-xs font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
               UPDATED 08:00 AM (KST)
             </span>
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Market Discovery</h1>
          <p className="text-slate-400 mt-2">
            오늘 아침 발굴한 <span className="text-emerald-400 font-bold">$1 미만 급등 후보군</span>입니다. 
            관심 종목을 클릭하여 <span className="text-indigo-400 font-bold">AI 심층 분석(Step 3)</span>을 진행하세요.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={fetchStocks}
            disabled={loading}
            className="p-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-400 hover:text-white transition-colors disabled:opacity-50"
            title="새로고침"
          >
            <RefreshCw className={clsx('w-5 h-5', loading && 'animate-spin')} />
          </button>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
            <input 
              type="text" 
              placeholder="티커 또는 회사명 검색..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-slate-900 border border-slate-700 text-white rounded-lg pl-10 pr-4 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none w-64"
            />
          </div>
        </div>
      </div>

      <Card className="overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm min-w-[800px]">
              <thead className="bg-slate-800/50 text-slate-400 uppercase font-medium">
                <tr>
                  <th className="px-6 py-4">티커</th>
                  <th className="px-6 py-4">격</th>
                  <th className="px-6 py-4">변동</th>
                  <th className="px-6 py-4">거래량</th>
                  <th className="px-6 py-4">시가총액</th>
                  <th className="px-6 py-4">DNA 점수</th>
                  <th className="px-6 py-4">섹터</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {filteredStocks.map((stock) => (
                  <tr 
                    key={stock.id} 
                    onClick={() => navigate(`/stock/${stock.ticker}`)}
                    className="hover:bg-slate-800/50 cursor-pointer transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div className="font-bold text-white">{stock.ticker}</div>
                      <div className="text-xs text-slate-500">{stock.name}</div>
                    </td>
                    <td className="px-6 py-4 font-mono text-slate-200">
                      ${stock.price.toFixed(2)}
                    </td>
                    <td className="px-6 py-4">
                      <div className={clsx("flex items-center gap-1", stock.changePercent >= 0 ? "text-emerald-400" : "text-rose-400")}>
                        {stock.changePercent >= 0 ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                        <span className="font-medium">{Math.abs(stock.changePercent).toFixed(2)}%</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-400">
                      {stock.volume > 1000000 
                        ? `${(stock.volume / 1000000).toFixed(1)}M` 
                        : `${(stock.volume / 1000).toFixed(1)}k`}
                    </td>
                    <td className="px-6 py-4 text-slate-400">
                      {stock.marketCap}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-2 bg-slate-800 rounded-full overflow-hidden">
                          <div 
                            className={clsx("h-full rounded-full", stock.dnaScore > 80 ? 'bg-emerald-500' : stock.dnaScore > 60 ? 'bg-indigo-500' : 'bg-rose-500')}
                            style={{ width: `${stock.dnaScore}%` }}
                          ></div>
                        </div>
                        <span className="font-bold text-slate-200">{stock.dnaScore}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <Badge variant="neutral">{stock.sector}</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
};
