
import React from 'react';
import { Sparkles, LayoutDashboard, Video, Settings, User, Zap } from 'lucide-react';
import { UserTier } from '../../types';

interface NavigationProps {
  currentView: string;
  setView: (view: any) => void;
  credits: number;
  tier: UserTier;
  onKeyClick: () => void;
}

const Navigation: React.FC<NavigationProps> = ({ currentView, setView, credits, tier, onKeyClick }) => {
  return (
    <nav className="h-16 border-b border-white/5 bg-black/60 backdrop-blur-2xl flex items-center justify-between px-6 sticky top-0 z-[60] shadow-2xl">
      <div className="flex items-center gap-4 cursor-pointer group" onClick={() => setView('dashboard')}>
        <div className="bg-indigo-600 w-10 h-10 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-600/30 group-hover:scale-105 transition-all">
          <Sparkles className="w-5 h-5 text-white" />
        </div>
        <div className="flex flex-col">
          <span className="text-sm font-black tracking-widest uppercase text-white">Kaleidoscope</span>
          <span className="text-[8px] font-mono text-gray-500">v2.1_PRO_CORE</span>
        </div>
      </div>

      <div className="hidden md:flex items-center gap-1">
        {[
          { id: 'dashboard', label: 'Library', icon: LayoutDashboard },
          { id: 'editor', label: 'Studio', icon: Video },
          { id: 'settings', label: 'Settings', icon: Settings },
        ].map((item) => (
          <button
            key={item.id}
            onClick={() => setView(item.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-[10px] font-black tracking-[0.2em] uppercase transition-all ${
              currentView === item.id 
                ? 'text-indigo-400 bg-indigo-500/5' 
                : 'text-gray-500 hover:text-gray-200 hover:bg-white/5'
            }`}
          >
            <item.icon className="w-3.5 h-3.5" />
            {item.label}
          </button>
        ))}
      </div>

      <div className="flex items-center gap-4">
        <div className="bg-indigo-500/10 border border-indigo-500/20 px-4 py-1.5 rounded-full flex items-center gap-2">
          <Zap className="w-3 h-3 text-yellow-500 fill-yellow-500" />
          <span className="text-[10px] font-black tracking-tighter text-indigo-300">{credits} UNITS</span>
        </div>
        <button 
          onClick={onKeyClick}
          className="w-9 h-9 rounded-xl bg-gray-900 border border-white/5 flex items-center justify-center hover:border-indigo-500/30 transition-all text-gray-500 hover:text-indigo-400"
        >
          <User className="w-4 h-4" />
        </button>
      </div>
    </nav>
  );
};

export default Navigation;
