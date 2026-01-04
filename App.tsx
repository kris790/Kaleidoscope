
import React, { useState, useEffect, useMemo } from 'react';
import Navigation from './components/layout/Navigation';
import Dashboard from './pages/Dashboard';
import Editor from './pages/Editor';
import SettingsPage from './pages/SettingsPage';
import ApiKeyPrompt from './components/ApiKeyPrompt';
import { UserTier, Project, UserState } from './types';
import { STYLE_PRESETS } from './constants';

const App: React.FC = () => {
  const [view, setView] = useState<'dashboard' | 'editor' | 'settings'>('dashboard');
  const [hasApiKey, setHasApiKey] = useState(true);
  const [showKeyPrompt, setShowKeyPrompt] = useState(false);
  const [user, setUser] = useState<UserState>(() => {
    const saved = localStorage.getItem('kaleidoscope_user_v2');
    return saved ? JSON.parse(saved) : { credits: 5000, tier: UserTier.PRO, projects: [] };
  });
  
  const [currentProject, setCurrentProject] = useState<Partial<Project>>({
    prompt: '',
    negativePrompt: '',
    audioPrompt: '',
    selectedVoice: 'Zephyr',
    style: STYLE_PRESETS[0].id,
    tier: UserTier.PRO,
    status: 'idle',
    clips: []
  });

  useEffect(() => {
    localStorage.setItem('kaleidoscope_user_v2', JSON.stringify(user));
  }, [user]);

  useEffect(() => {
    const checkKey = async () => {
      if (window.aistudio) {
        const hasKey = await window.aistudio.hasSelectedApiKey();
        setHasApiKey(hasKey);
        if (!hasKey) setShowKeyPrompt(true);
      }
    };
    checkKey();
  }, []);

  const handleOpenProject = (project: Project) => {
    setCurrentProject(project);
    setView('editor');
  };

  const handleDeleteProject = (id: string) => {
    setUser(prev => ({
      ...prev,
      projects: prev.projects.filter(p => p.id !== id)
    }));
  };

  const handleCreateNew = () => {
    setCurrentProject({
      id: Math.random().toString(36).substr(2, 9),
      prompt: '',
      negativePrompt: '',
      audioPrompt: '',
      selectedVoice: 'Zephyr',
      style: STYLE_PRESETS[0].id,
      tier: user.tier,
      status: 'idle',
      clips: []
    });
    setView('editor');
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-950 text-gray-100 selection:bg-indigo-500/30 font-sans">
      {showKeyPrompt && (
        <ApiKeyPrompt 
          onKeySelected={() => { setHasApiKey(true); setShowKeyPrompt(false); }} 
          onDismiss={() => setShowKeyPrompt(false)} 
        />
      )}

      <Navigation 
        currentView={view} 
        setView={setView} 
        credits={user.credits} 
        tier={user.tier}
        onKeyClick={() => setShowKeyPrompt(true)}
      />

      <main className="flex-1 overflow-hidden flex flex-col p-4 md:p-8">
        {view === 'dashboard' && (
          <Dashboard 
            projects={user.projects} 
            onOpenProject={handleOpenProject} 
            onDeleteProject={handleDeleteProject}
            onCreateNew={handleCreateNew}
          />
        )}
        
        {view === 'editor' && (
          <Editor 
            project={currentProject} 
            user={user} 
            setUser={setUser} 
            setCurrentProject={setCurrentProject}
            setView={setView}
          />
        )}

        {view === 'settings' && (
          <SettingsPage user={user} setUser={setUser} />
        )}
      </main>

      <footer className="h-14 border-t border-white/5 bg-black/60 flex items-center justify-between px-8 backdrop-blur-3xl shrink-0 z-50">
        <div className="flex items-center gap-8">
           <div className="flex items-center gap-2.5 text-gray-600">
             <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse"></div>
             <span className="text-[9px] font-black uppercase tracking-[0.2em]">Tier Status: {user.tier}</span>
           </div>
           <div className="flex items-center gap-2.5 text-indigo-500/40">
             <span className="text-[9px] font-black uppercase tracking-[0.2em]">Engine: VEO_3.1_LATEST</span>
           </div>
        </div>
        <div className="flex items-center gap-3">
           <span className="text-[9px] font-black text-gray-700 uppercase tracking-widest">© 2025 KALEIDOSCOPE_STUDIOS</span>
        </div>
      </footer>

      <style>{`
        @keyframes progress { 0% { width: 0%; opacity: 1; } 95% { width: 98%; opacity: 1; } 100% { width: 100%; opacity: 0; } }
        .custom-scroll::-webkit-scrollbar { width: 4px; height: 4px; }
        .custom-scroll::-webkit-scrollbar-track { background: transparent; }
        .custom-scroll::-webkit-scrollbar-thumb { background: #312e81; border-radius: 10px; }
        .scrollbar-hide::-webkit-scrollbar { display: none; }
      `}</style>
    </div>
  );
};

export default App;
