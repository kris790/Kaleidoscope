
import React from 'react';
import { Key, ExternalLink, ShieldCheck } from 'lucide-react';

interface ApiKeyPromptProps {
  onKeySelected: () => void;
}

const ApiKeyPrompt: React.FC<ApiKeyPromptProps> = ({ onKeySelected }) => {
  const handleOpenKeySelector = async () => {
    try {
      // Added safety check for window.aistudio
      if (window.aistudio) {
        await window.aistudio.openSelectKey();
      }
      // Per instructions, assume success after triggering
      onKeySelected();
    } catch (err) {
      console.error("Failed to open key selector", err);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
      <div className="max-w-md w-full bg-gray-900 border border-indigo-500/30 rounded-2xl p-8 shadow-2xl text-center space-y-6">
        <div className="mx-auto w-20 h-20 bg-indigo-500/10 rounded-full flex items-center justify-center">
          <Key className="w-10 h-10 text-indigo-400" />
        </div>
        
        <div className="space-y-2">
          <h2 className="text-2xl font-bold text-white">Professional API Key Required</h2>
          <p className="text-gray-400">
            Kaleidoscope uses advanced Gemini Veo models which require a selected billing project from your Google Cloud account.
          </p>
        </div>

        <div className="bg-gray-800/50 rounded-lg p-4 text-sm text-left flex items-start gap-3 border border-gray-700">
          <ShieldCheck className="w-5 h-5 text-green-400 shrink-0 mt-0.5" />
          <span className="text-gray-300">
            Your key remains private. You must select an API key from a 
            <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" rel="noopener noreferrer" className="text-indigo-400 hover:underline inline-flex items-center gap-1 mx-1">
              paid GCP project <ExternalLink className="w-3 h-3" />
            </a> 
            to enable video generation.
          </span>
        </div>

        <button
          onClick={handleOpenKeySelector}
          className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-4 rounded-xl transition-all shadow-lg shadow-indigo-500/20 active:scale-95"
        >
          Select Professional API Key
        </button>
      </div>
    </div>
  );
};

export default ApiKeyPrompt;
