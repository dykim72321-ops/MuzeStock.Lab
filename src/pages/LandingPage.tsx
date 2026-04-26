import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useMockAuth } from '../hooks/useMockAuth';
import { Activity, Globe, Lock, ArrowRight, Loader2 } from 'lucide-react';

export default function LandingPage() {
  const { isLoading, isAuthenticated, signIn } = useMockAuth();
  const navigate = useNavigate();

  // If already authenticated, show Domain Portal
  if (isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#0a0f1c] text-white flex flex-col items-center justify-center p-6 relative overflow-hidden">
        {/* Background glow effects */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-600/20 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-cyan-600/20 rounded-full blur-[120px] pointer-events-none" />

        <div className="max-w-6xl w-full z-10 flex flex-col gap-12">
          <div className="text-center space-y-4">
            <h1 className="text-5xl font-black tracking-tight text-white mb-2 flex items-center justify-center gap-3">
              <Activity className="w-10 h-10 text-blue-500" /> MuzeBIZ.Lab
            </h1>
            <p className="text-slate-400 text-lg">Select your operational domain</p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {/* MuzeStock Card */}
            <motion.div 
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="glass-panel p-8 rounded-2xl flex flex-col items-center text-center cursor-pointer neon-glow-blue group"
              onClick={() => navigate('/stock/dashboard')}
            >
              <div className="w-20 h-20 rounded-2xl bg-blue-500/10 flex items-center justify-center mb-6 group-hover:bg-blue-500/20 transition-colors">
                <Activity className="w-10 h-10 text-blue-400" />
              </div>
              <h2 className="text-3xl font-bold mb-3">MuzeStock (Finance)</h2>
              <p className="text-slate-400 mb-8 flex-1">
                Deep Analysis for Financial Precision. Access the Quant Operation Command Center.
              </p>
              <button className="sfdc-button-primary w-full max-w-xs flex items-center justify-center gap-2">
                Explore MuzeStock <ArrowRight className="w-4 h-4" />
              </button>
            </motion.div>

            {/* Muzepart Card */}
            <motion.div 
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="glass-panel p-8 rounded-2xl flex flex-col items-center text-center cursor-pointer shadow-[0_0_20px_rgba(34,211,238,0.1)] hover:shadow-[0_0_30px_rgba(34,211,238,0.3)] hover:border-cyan-400/60 border border-white/5 transition-all duration-300 group"
              onClick={() => navigate('/parts-search')}
            >
              <div className="w-20 h-20 rounded-2xl bg-cyan-500/10 flex items-center justify-center mb-6 group-hover:bg-cyan-500/20 transition-colors">
                <Globe className="w-10 h-10 text-cyan-400" />
              </div>
              <h2 className="text-3xl font-bold mb-3">Muzepart (Supply Chain)</h2>
              <p className="text-slate-400 mb-8 flex-1">
                Global Sourcing & Logistics Optimization. End-to-End Supply Chain Visibility.
              </p>
              <button className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-md transition-all text-sm font-bold shadow-[0_0_15px_rgba(8,145,178,0.4)] w-full max-w-xs flex items-center justify-center gap-2">
                Explore Muzepart <ArrowRight className="w-4 h-4" />
              </button>
            </motion.div>
          </div>
        </div>
      </div>
    );
  }

  // Pre-Login Hero View
  return (
    <div className="min-h-screen bg-[#0a0f1c] flex items-center relative overflow-hidden font-sans">
      {/* Abstract Tech Background */}
      <div className="absolute inset-0 pointer-events-none opacity-40 mix-blend-screen" 
           style={{
             backgroundImage: 'radial-gradient(circle at 50% 50%, rgba(30,58,138,0.5) 0%, transparent 50%), radial-gradient(circle at 80% 80%, rgba(14,116,144,0.4) 0%, transparent 40%)',
             backgroundSize: '100% 100%'
           }} 
      />
      
      <div className="max-w-7xl mx-auto w-full grid lg:grid-cols-5 gap-12 p-8 lg:p-12 relative z-10 items-center">
        
        {/* Left: Hero Copy */}
        <div className="lg:col-span-3 space-y-6">
          <h1 className="text-5xl lg:text-7xl font-black text-white leading-tight">
            MuzeBIZ.Lab<br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-300">
              Integrated Quant &<br/>Supply Chain Intelligence
            </span>
          </h1>
          <p className="text-slate-400 text-lg max-w-xl leading-relaxed">
            Unlock new frontiers with our B2B/B2C platform connecting Quant Investment (MuzeStock) and Supply Chain (Muzepart) into a singular, powerful data powerhouse.
          </p>
        </div>

        {/* Right: Login Card */}
        <div className="lg:col-span-2">
          <div className="glass-panel p-8 sm:p-10 rounded-2xl neon-glow-blue w-full max-w-md mx-auto">
            <div className="space-y-4 mb-8">
              <h2 className="text-2xl font-bold text-white">Welcome Back,<br/>MuzeBIZ.Lab Member</h2>
              <p className="text-sm text-slate-400">Secure & Trusted Access</p>
            </div>

            <form className="space-y-5" onSubmit={(e) => { e.preventDefault(); signIn(''); }}>
              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-2">Email Address</label>
                <input 
                  type="email" 
                  placeholder="Enter your email" 
                  className="w-full bg-slate-900/80 border border-slate-700 rounded-lg px-4 py-3 text-slate-200 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all placeholder:text-slate-600"
                  defaultValue="admin@muzestop.lab"
                  readOnly
                />
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-2">Password</label>
                <input 
                  type="password" 
                  placeholder="••••••••" 
                  className="w-full bg-slate-900/80 border border-slate-700 rounded-lg px-4 py-3 text-slate-200 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all placeholder:text-slate-600"
                  defaultValue="hunterpassword"
                  readOnly
                />
              </div>

              <div className="flex items-center justify-between text-sm">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" className="rounded border-slate-600 bg-slate-800 text-blue-500 focus:ring-blue-500/30" defaultChecked/>
                  <span className="text-slate-400">Remember me</span>
                </label>
                <a href="#" className="text-blue-400 hover:text-blue-300 transition-colors">Forgot Password?</a>
              </div>

              <button 
                type="submit" 
                disabled={isLoading}
                className="w-full py-3.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-bold shadow-[0_0_20px_rgba(37,99,235,0.4)] transition-all flex justify-center items-center mt-4"
              >
                {isLoading ? <Loader2 className="w-5 h-5 animate-spin"/> : 'Log In'}
              </button>
            </form>

            <div className="mt-8 pt-6 border-t border-slate-700/50 flex flex-col items-center gap-4">
              <span className="text-xs font-semibold text-slate-500 tracking-wider flex items-center gap-2 uppercase">
                <Lock className="w-3 h-3"/> Enterprise SSO
              </span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
