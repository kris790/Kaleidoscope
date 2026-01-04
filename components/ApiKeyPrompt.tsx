import React from 'react';
import { Key, ExternalLink, ShieldCheck, X, Eye } from 'lucide-react';

interface ApiKeyPromptProps {
  onKeySelected: () => void;
  onDismiss: () => void;
}

const ApiKeyPrompt: React.FC<ApiKeyPromptProps> = ({ onKeySelected, onDismiss }) => {
  const handleOpenKeySelector = async () => {
    try {
      if (window.aistudio) {
        await window.aistudio.openSelectKey();
      }
      onKeySelected();
    } catch (err) {
      console.error("Failed to open key selector", err);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-xl p-4">
      <div className="max-w-md w-full bg-gray-900 border border-indigo-500/30 rounded-[2.5rem] p-10 shadow-[0_0_100px_rgba(79,70,229,0.2)] text-center space-y-8 relative overflow-hidden">
        {/* Close Button */}
        <button 
          onClick={onDismiss}
          className="absolute top-6 right-6 p-2 bg-gray-800/50 hover:bg-gray-800 rounded-full text-gray-500 hover:text-white transition-all"
          title="Explore UI only"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="mx-auto w-24 h-24 bg-indigo-500/10 rounded-[2rem] flex items-center justify-center border border-indigo-500/20 shadow-inner">
          <Key className="w-10 h-10 text-indigo-400" />
        </div>
        
        <div className="space-y-3">
          <h2 className="text-3xl font-black tracking-tighter uppercase tracking-[0.1em] text-white">Production Key</h2>
          <p className="text-gray-400 text-sm font-medium leading-relaxed">
            Kaleidoscope uses professional-grade **Gemini Veo** models. A selected billing project is required for rendering.
          </p>
        </div>

        <div className="bg-gray-800/40 rounded-2xl p-5 text-xs text-left flex items-start gap-4 border border-gray-700/50">
          <ShieldCheck className="w-6 h-6 text-indigo-400 shrink-0 mt-0.5" />
          <div className="space-y-2">
            <span className="text-gray-300 font-medium block">
              Your key remains private. You must select an API key from a 
              <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" rel="noopener noreferrer" className="text-indigo-400 hover:underline inline-flex items-center gap-1 mx-1 font-black">
                paid GCP project <ExternalLink className="w-3 h-3" />
              </a> 
            </span>
            <span className="text-gray-500 text-[10px] uppercase tracking-widest font-black">
              Standard free-tier keys do not support Veo Video.
            </span>
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <button
            onClick={handleOpenKeySelector}
            className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-black uppercase tracking-[0.2em] text-xs py-5 rounded-2xl transition-all shadow-[0_10px_30px_rgba(79,70,229,0.3)] active:scale-95"
          >
            Select Production Key
          </button>
          
          <button
            onClick={onDismiss}
            className="w-full bg-transparent hover:bg-gray-800/50 text-gray-500 hover:text-gray-300 font-black uppercase tracking-[0.2em] text-[10px] py-4 rounded-2xl transition-all flex items-center justify-center gap-2"
          >
            <Eye className="w-4 h-4" /> Preview Interface Only
          </button>
        </div>
      </div>
    </div>
  );
};

export default ApiKeyPrompt;