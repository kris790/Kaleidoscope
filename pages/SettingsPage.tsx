
import React from 'react';
import { User, CreditCard, Shield, Zap, ExternalLink, Info, Activity } from 'lucide-react';
import { UserState, UserTier } from '../types';

interface SettingsPageProps {
  user: UserState;
  setUser: React.Dispatch<React.SetStateAction<UserState>>;
}

const SettingsPage: React.FC<SettingsPageProps> = ({ user, setUser }) => {
  return (
    <div className="max-w-4xl mx-auto w-full space-y-12 animate-in slide-in-from-bottom-8 duration-700 pb-20">
      <header className="space-y-2">
        <h1 className="text-4xl font-black tracking-tighter uppercase text-white">Platform Control</h1>
        <p className="text-gray-500 text-sm font-medium">Manage your production pipeline and unit allocation.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-gray-900/40 border border-white/5 rounded-[3rem] p-10 space-y-8 shadow-2xl backdrop-blur-xl">
          <div className="flex items-center gap-5">
            <div className="p-5 bg-indigo-600 rounded-[1.5rem] shadow-2xl shadow-indigo-600/30 ring-1 ring-white/20">
              <User className="w-8 h-8 text-white" />
            </div>
            <div>
              <h3 className="text-sm font-black uppercase tracking-widest text-white">Production Tier</h3>
              <p className="text-xs text-indigo-400 font-bold uppercase tracking-wider">{user.tier} Protocol</p>
            </div>
          </div>
          
          <div className="space-y-4">
            <div className="flex justify-between items-end">
              <div className="space-y-1">
                <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">Resource Balance</span>
                <p className="text-2xl font-black text-white">{user.credits.toLocaleString()} <span className="text-gray-600 text-xs">UNITS</span></p>
              </div>
              <span className="text-[10px] font-black text-gray-700 uppercase">10,000 Cap</span>
            </div>
            <div className="h-3 bg-gray-800/50 rounded-full overflow-hidden border border-white/5 shadow-inner p-0.5">
              <div 
                className="h-full bg-gradient-to-r from-indigo-600 to-indigo-400 rounded-full shadow-[0_0_15px_rgba(99,102,241,0.5)] transition-all duration-1000" 
                style={{ width: `${(user.credits / 10000) * 100}%` }}
              ></div>
            </div>
          </div>

          <button 
            onClick={() => setUser(prev => ({ ...prev, credits: Math.min(prev.credits + 2500, 10000) }))} 
            className="w-full py-5 bg-gray-800 hover:bg-gray-700 border border-white/5 rounded-[1.5rem] text-[10px] font-black uppercase tracking-[0.3em] text-white transition-all active:scale-95 shadow-xl"
          >
            Refill Pipeline Units
          </button>
        </div>

        <div className="bg-gray-900/40 border border-white/5 rounded-[3rem] p-10 space-y-8 shadow-2xl backdrop-blur-xl">
          <div className="flex items-center gap-5">
            <div className="p-5 bg-yellow-500/10 rounded-[1.5rem] border border-yellow-500/20 shadow-inner">
              <CreditCard className="w-8 h-8 text-yellow-500" />
            </div>
            <div>
              <h3 className="text-sm font-black uppercase tracking-widest text-white">Billing Matrix</h3>
              <p className="text-xs text-gray-500 font-bold uppercase">Next reset: Dec 15</p>
            </div>
          </div>
          
          <div className="p-6 bg-white/5 rounded-3xl border border-white/5 space-y-4">
            <p className="text-xs text-gray-400 leading-relaxed font-medium">
              Your Professional subscription enables priority GPU access, 1080p resolution, and temporal extension for sequences up to 60 seconds.
            </p>
            <div className="flex items-center gap-3 text-[10px] font-black text-indigo-400 uppercase tracking-widest">
              <Shield className="w-4 h-4" /> Priority Rendering Active
            </div>
          </div>

          <button className="w-full py-5 border border-white/5 hover:bg-gray-800 rounded-[1.5rem] text-[10px] font-black uppercase tracking-[0.3em] text-gray-400 hover:text-white transition-all">
            Update Subscription
          </button>
        </div>
      </div>

      <div className="bg-gradient-to-br from-indigo-600 to-indigo-900 p-12 rounded-[4rem] shadow-2xl shadow-indigo-600/30 flex flex-col md:flex-row items-center justify-between gap-10 border border-white/20 relative overflow-hidden group">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10"></div>
        <div className="space-y-3 text-center md:text-left relative z-10">
          <h3 className="text-3xl font-black uppercase tracking-tighter text-white">Enterprise Production</h3>
          <p className="text-indigo-100/70 text-sm font-medium max-w-md">
            Need custom model fine-tuning or high-throughput API access for your studio? 
          </p>
        </div>
        <button className="bg-white text-indigo-600 px-12 py-5 rounded-[1.5rem] font-black uppercase tracking-[0.2em] text-[11px] hover:scale-110 active:scale-95 transition-all shadow-[0_20px_40px_rgba(255,255,255,0.2)] relative z-10">
          Contact Protocol Sales
        </button>
        
        {/* Decorative elements */}
        <div className="absolute -top-20 -right-20 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-indigo-400/20 rounded-full blur-3xl"></div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { label: 'Documentation', icon: ExternalLink, href: '#' },
          { label: 'API Status', icon: Activity, href: '#' },
          { label: 'Privacy Protocol', icon: Shield, href: '#' },
        ].map((item, idx) => (
          <a 
            key={idx} 
            href={item.href} 
            className="p-6 bg-gray-900/40 border border-white/5 rounded-3xl flex items-center justify-between hover:bg-gray-800 transition-all group shadow-xl"
          >
            <span className="text-[10px] font-black uppercase tracking-widest text-gray-500 group-hover:text-white">{item.label}</span>
            <item.icon className="w-4 h-4 text-gray-700 group-hover:text-indigo-400" />
          </a>
        ))}
      </div>
    </div>
  );
};

export default SettingsPage;
