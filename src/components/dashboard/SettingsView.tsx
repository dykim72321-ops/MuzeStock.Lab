import { useState } from 'react';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { 
  Key, 
  Settings as SettingsIcon, 
  Bell, 
  Zap, 
  ShieldCheck, 
  Database,
  Cpu,
  Brain
} from 'lucide-react';

export const SettingsView = () => {
  const [activeTab, setActiveTab] = useState('general');

  const tabs = [
    { id: 'general', name: 'General', icon: SettingsIcon },
    { id: 'api', name: 'API Keys', icon: Key },
    { id: 'strategy', name: 'AI Strategy', icon: Brain },
    { id: 'notifications', name: 'Alerts', icon: Bell },
  ];

  return (
    <div className="space-y-8 animate-fade-in pb-20">
      {/* Header */}
      <div className="border-b border-slate-800 pb-6">
        <h1 className="text-4xl font-black text-white tracking-tight flex items-center gap-3">
          <SettingsIcon className="w-10 h-10 text-indigo-500" />
          System Terminal Settings
        </h1>
        <p className="text-slate-400 mt-2 max-w-2xl text-sm font-medium">
          Configure your AI engine, manage API quotas, and fine-tune DNA matching algorithms.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
        {/* Sidebar Tabs */}
        <div className="space-y-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium text-sm ${
                activeTab === tab.id
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.name}
            </button>
          ))}
        </div>

        {/* Content Area */}
        <div className="md:col-span-3 space-y-6">
          {activeTab === 'general' && (
            <div className="space-y-6">
              <Card className="p-6">
                <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                  <Cpu className="w-5 h-5 text-indigo-400" /> System Profile
                </h3>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-widest leading-loose">Default Region</label>
                      <select className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 focus:border-indigo-500 outline-none transition-all">
                        <option>Korea (Seoul)</option>
                        <option>US East (Virginia)</option>
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-widest leading-loose">Language</label>
                      <select className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 focus:border-indigo-500 outline-none transition-all">
                        <option>Korean (default)</option>
                        <option>English</option>
                      </select>
                    </div>
                  </div>
                </div>
              </Card>

              <Card className="p-6 border-amber-500/20 bg-amber-500/5">
                <div className="flex items-start gap-4">
                  <div className="p-2 bg-amber-500/20 rounded-lg">
                    <Zap className="w-5 h-5 text-amber-500" />
                  </div>
                  <div>
                    <h4 className="text-amber-400 font-bold mb-1">Developer Mode</h4>
                    <p className="text-sm text-slate-400 mb-4">Enable experimental features and verbose logging in the DNA analysis engine.</p>
                    <button className="px-4 py-2 bg-amber-500 text-slate-950 font-bold rounded-lg text-xs hover:bg-amber-400 transition-colors uppercase">
                      Enable Debug Terminal
                    </button>
                  </div>
                </div>
              </Card>
            </div>
          )}

          {activeTab === 'api' && (
            <Card className="p-6 space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Database className="w-5 h-5 text-indigo-400" /> API Infrastructure
                </h3>
                <Badge variant="success">Active</Badge>
              </div>
              
              <div className="space-y-4">

                <div className="space-y-2">
                  <div className="flex justify-between">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Alpha Vantage Key</label>
                    <span className="text-[10px] text-indigo-400 font-mono">ACTIVE (FREE TIER)</span>
                  </div>
                  <input 
                    type="password" 
                    value="••••••••••••••••"
                    readOnly
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-400 font-mono"
                  />
                </div>
              </div>

              <div className="p-4 rounded-xl border border-slate-800 bg-slate-950/50">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-slate-400">Monthly Usage</span>
                  <span className="text-xs text-slate-500 font-mono">420 / 1,000 requests</span>
                </div>
                <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full bg-indigo-500 w-[42%]"></div>
                </div>
              </div>
            </Card>
          )}

          {activeTab === 'strategy' && (
            <div className="space-y-6">
              <Card className="p-6">
                <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                  <Brain className="w-5 h-5 text-indigo-400" /> DNA Scoring Logic
                </h3>
                <p className="text-sm text-slate-400 mb-6">Adjust the weights for the DNA Pattern Match calculation.</p>
                
                <div className="space-y-6">
                  {[
                    { label: 'Volatility Match', weight: 40 },
                    { label: 'Fundamental Growth', weight: 30 },
                    { label: 'Whale Movement', weight: 20 },
                    { label: 'News Sentiment', weight: 10 },
                  ].map((item) => (
                    <div key={item.label} className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm font-medium text-slate-200">{item.label}</span>
                        <span className="text-sm font-mono text-indigo-400 font-bold">{item.weight}%</span>
                      </div>
                      <input type="range" className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500" value={item.weight} readOnly />
                    </div>
                  ))}
                </div>
              </Card>

              <Card className="p-6 border-indigo-500/20 bg-indigo-500/5">
                <div className="flex items-start gap-4">
                  <div className="p-2 bg-indigo-500/20 rounded-lg">
                    <ShieldCheck className="w-5 h-5 text-indigo-500" />
                  </div>
                  <div>
                    <h4 className="text-indigo-400 font-bold mb-1">Risk Mode: Conservative</h4>
                    <p className="text-sm text-slate-400">Strictly filter out stocks with high debt/equity ratios even if DNA match is high.</p>
                  </div>
                </div>
              </Card>
            </div>
          )}

          {activeTab === 'notifications' && (
            <Card className="p-6">
              <h3 className="text-lg font-bold text-white mb-6">Alert Configurations</h3>
              <div className="space-y-4">
                {[
                  { title: 'Whale Signal', desc: 'Notify when institutional ownership changes > 5%.', active: false },
                  { title: 'High DNA Match (>90%)', desc: 'Instant alert for high-confidence AI findings.', active: true },
                  { title: 'System Status', desc: 'Alert if engine goes offline or API limit reached.', active: true },
                ].map((item, i) => (
                  <div key={i} className="flex items-center justify-between p-4 rounded-xl hover:bg-slate-800/50 transition-colors border border-transparent hover:border-slate-700">
                    <div>
                      <div className="text-sm font-bold text-white">{item.title}</div>
                      <div className="text-xs text-slate-500 mt-1">{item.desc}</div>
                    </div>
                    <div className={`w-10 h-5 rounded-full relative transition-colors ${item.active ? 'bg-indigo-600' : 'bg-slate-700'}`}>
                      <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${item.active ? 'left-6' : 'left-1'}`}></div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};
