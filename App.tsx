import React, { useState, useEffect, useRef } from 'react';
import { 
  Plus, 
  LayoutDashboard, 
  Video, 
  History, 
  Settings, 
  Sparkles, 
  Zap, 
  User, 
  ArrowRight, 
  Play, 
  Download, 
  RefreshCcw, 
  Image as ImageIcon,
  Trash2,
  Clock,
  Layers,
  ChevronLeft,
  Ban,
  Volume2,
  Mic,
  Music,
  Waves,
  Palette,
  ShieldAlert,
  Loader2,
  X,
  ChevronUp,
  ChevronDown,
  Maximize2,
  FastForward,
  Globe
} from 'lucide-react';
import { UserTier, Project, UserState } from './types';
import { STYLE_PRESETS, TIER_CONFIG } from './constants';
import { GeminiService } from './services/geminiService';
import ApiKeyPrompt from './components/ApiKeyPrompt';
import StyleGrid from './components/StyleGrid';

const VOICES = [
  { id: 'Kore', name: 'Kore', desc: 'Professional & Calm' },
  { id: 'Puck', name: 'Puck', desc: 'Energetic & Youthful' },
  { id: 'Charon', name: 'Charon', desc: 'Deep & Authoritative' },
  { id: 'Zephyr', name: 'Zephyr', desc: 'Smooth & Warm' },
  { id: 'Fenrir', name: 'Fenrir', desc: 'Rugged & Bold' }
];

const SkeletonCard = () => (
  <div className="w-48 aspect-video rounded-xl bg-gray-900 overflow-hidden animate-pulse border border-gray-800 shrink-0">
    <div className="w-full h-full bg-gradient-to-r from-gray-900 via-gray-800/50 to-gray-900"></div>
  </div>
);

const App: React.FC = () => {
  const [view, setView] = useState<'dashboard' | 'editor'>('dashboard');
  const [sidebarTab, setSidebarTab] = useState<'video' | 'audio'>('video');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [hasApiKey, setHasApiKey] = useState(true);
  const [showKeyPrompt, setShowKeyPrompt] = useState(false);
  const [groundingEnabled, setGroundingEnabled] = useState(false);
  const [user, setUser] = useState<UserState>({
    credits: 500,
    tier: UserTier.PLUS,
    projects: []
  });
  
  const [currentProject, setCurrentProject] = useState<Partial<Project>>({
    prompt: '',
    negativePrompt: '',
    audioPrompt: '',
    selectedVoice: 'Zephyr',
    style: STYLE_PRESETS[0].id,
    tier: UserTier.PLUS,
    status: 'idle'
  });

  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [generationMsg, setGenerationMsg] = useState<string>('');
  const [audioGenMsg, setAudioGenMsg] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    const checkKey = async () => {
      if (window.aistudio) {
        const hasKey = await window.aistudio.hasSelectedApiKey();
        setHasApiKey(hasKey);
        setShowKeyPrompt(!hasKey);
      }
    };
    checkKey();
  }, []);

  const handleCreateNew = () => {
    setCurrentProject({
      prompt: '',
      negativePrompt: '',
      audioPrompt: '',
      selectedVoice: 'Zephyr',
      style: STYLE_PRESETS[0].id,
      tier: user.tier,
      status: 'idle'
    });
    setUploadedImage(null);
    setView('editor');
    setSidebarTab('video');
    setIsSidebarOpen(true);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setUploadedImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const startGeneration = async () => {
    if (!currentProject.prompt) return;
    
    const config = TIER_CONFIG[user.tier];
    const cost = config.maxDuration * config.creditsPerSec;
    if (user.credits < cost) {
      setError("Insufficient credits. Please upgrade or wait for rollover.");
      return;
    }

    setError(null);
    setCurrentProject(prev => ({ ...prev, status: 'generating' }));

    const style = STYLE_PRESETS.find(s => s.id === currentProject.style);
    let fullPrompt = `${currentProject.prompt}${style?.promptSuffix || ''}`;
    
    if (currentProject.negativePrompt) {
      fullPrompt += `. Avoid the following elements: ${currentProject.negativePrompt}.`;
    }

    try {
      const videoUrl = await GeminiService.generateVideo({
        prompt: fullPrompt,
        tier: user.tier,
        image: uploadedImage || undefined,
        onProgress: (msg) => setGenerationMsg(msg)
      });

      const newProject: Project = {
        id: Math.random().toString(36).substr(2, 9),
        title: currentProject.prompt.slice(0, 30) + (currentProject.prompt.length > 30 ? '...' : ''),
        prompt: currentProject.prompt,
        negativePrompt: currentProject.negativePrompt,
        audioPrompt: currentProject.audioPrompt,
        selectedVoice: currentProject.selectedVoice,
        videoUrl,
        audioUrl: currentProject.audioUrl,
        thumbnailUrl: uploadedImage || `https://picsum.photos/seed/${Math.random()}/300/200`,
        createdAt: Date.now(),
        duration: config.maxDuration,
        resolution: config.resolution,
        style: currentProject.style!,
        status: 'completed',
        tier: user.tier
      };

      setUser(prev => ({
        ...prev,
        credits: prev.credits - cost,
        projects: [newProject, ...prev.projects]
      }));
      setCurrentProject(newProject);
    } catch (err: any) {
      if (err.message === 'API_KEY_RESET_REQUIRED') {
        setHasApiKey(false);
        setShowKeyPrompt(true);
      } else {
        setError(err.message || "Something went wrong during generation. Check your API Key.");
        setCurrentProject(prev => ({ ...prev, status: 'failed' }));
      }
    } finally {
      setGenerationMsg('');
    }
  };

  const handleExtend = async () => {
    if (!currentProject.videoUrl || !currentProject.prompt) return;
    
    setError(null);
    const cost = 10; // Extension flat fee
    if (user.credits < cost) {
      setError("Insufficient credits for extension.");
      return;
    }

    setCurrentProject(prev => ({ ...prev, status: 'generating' }));
    
    try {
      const extendedUrl = await GeminiService.extendVideo({
        prompt: `Continuing the scene: ${currentProject.prompt}`,
        previousVideoUri: currentProject.videoUrl, // Note: In a real app, this would be the actual URI, not the local Blob URL.
        onProgress: (msg) => setGenerationMsg(msg)
      });
      
      setCurrentProject(prev => ({ 
        ...prev, 
        videoUrl: extendedUrl, 
        status: 'completed',
        duration: (prev.duration || 0) + 7
      }));
      
      setUser(prev => ({ ...prev, credits: prev.credits - cost }));
    } catch (err: any) {
      setError("Extension failed. Verify your production key status.");
      setCurrentProject(prev => ({ ...prev, status: 'completed' }));
    } finally {
      setGenerationMsg('');
    }
  };

  const handleGenerateAudio = async () => {
    if (!currentProject.audioPrompt) return;
    
    setAudioGenMsg('Synthesizing voice...');
    try {
      const audioUrl = await GeminiService.generateAudio({
        prompt: currentProject.audioPrompt,
        voiceName: currentProject.selectedVoice || 'Zephyr'
      });
      setCurrentProject(prev => ({ ...prev, audioUrl }));
    } catch (err: any) {
      setError("Audio generation failed: " + err.message);
    } finally {
      setAudioGenMsg('');
    }
  };

  const deleteProject = (id: string) => {
    setUser(prev => ({
      ...prev,
      projects: prev.projects.filter(p => p.id !== id)
    }));
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-950 text-gray-100 selection:bg-indigo-500/30">
      {showKeyPrompt && (
        <ApiKeyPrompt 
          onKeySelected={() => {
            setHasApiKey(true);
            setShowKeyPrompt(false);
          }} 
          onDismiss={() => setShowKeyPrompt(false)}
        />
      )}

      {/* Navigation */}
      <nav className="border-b border-gray-800 bg-gray-900/50 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 cursor-pointer group" onClick={() => setView('dashboard')}>
            <div className="bg-indigo-600 p-2 rounded-lg transition-transform group-hover:scale-110">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-black tracking-tighter hidden sm:inline">KALEIDOSCOPE</span>
          </div>

          <div className="flex items-center gap-4 sm:gap-8">
            <button 
              onClick={() => setView('dashboard')}
              className={`flex items-center gap-2 font-bold text-[10px] sm:text-sm uppercase tracking-widest transition-colors ${view === 'dashboard' ? 'text-indigo-400' : 'text-gray-400 hover:text-white'}`}
            >
              <LayoutDashboard className="w-4 h-4" /> <span className="hidden xs:inline">Dashboard</span>
            </button>
            <button 
              onClick={handleCreateNew}
              className={`flex items-center gap-2 font-bold text-[10px] sm:text-sm uppercase tracking-widest transition-colors ${view === 'editor' ? 'text-indigo-400' : 'text-gray-400 hover:text-white'}`}
            >
              <Video className="w-4 h-4" /> <span className="hidden xs:inline">Create</span>
            </button>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden xs:flex items-center gap-2 bg-gray-800/50 px-3 py-1.5 rounded-full border border-gray-700">
              <Zap className="w-3.5 h-3.5 text-yellow-500 fill-yellow-500" />
              <span className="text-[10px] font-black tracking-tighter">{user.credits}</span>
            </div>
            <button 
              onClick={() => setShowKeyPrompt(true)}
              className="bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] font-black uppercase tracking-widest px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg transition-all active:scale-95 shadow-lg shadow-indigo-600/20"
            >
              {hasApiKey ? 'Key' : 'Setup'}
            </button>
          </div>
        </div>
      </nav>

      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8 overflow-hidden flex flex-col">
        
        {view === 'dashboard' ? (
          <div className="space-y-8 animate-in fade-in duration-500">
            <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
              <div>
                <h1 className="text-3xl font-black tracking-tight">Project Library</h1>
                <p className="text-gray-400 mt-1 font-medium">Manage and remix your high-fidelity cinematic assets</p>
              </div>
              <button 
                onClick={handleCreateNew}
                className="bg-indigo-600 hover:bg-indigo-500 text-white font-black uppercase tracking-widest text-xs px-6 py-3 rounded-xl flex items-center gap-2 transition-all active:scale-95"
              >
                <Plus className="w-5 h-5" /> New Production
              </button>
            </header>

            {user.projects.length === 0 ? (
              <div className="bg-gray-900/50 border-2 border-dashed border-gray-800 rounded-[2rem] p-12 sm:p-24 text-center space-y-6">
                <div className="bg-gray-800 w-24 h-24 rounded-full flex items-center justify-center mx-auto ring-8 ring-gray-900">
                  <Video className="w-12 h-12 text-gray-500" />
                </div>
                <div className="space-y-2">
                  <h2 className="text-2xl font-black tracking-tight">Your library is empty</h2>
                  <p className="text-gray-400 max-w-sm mx-auto font-medium text-sm">
                    The future of cinematic production is just one prompt away. Start creating with Gemini Veo.
                  </p>
                </div>
                <button 
                  onClick={handleCreateNew}
                  className="inline-flex items-center gap-2 text-indigo-400 font-black uppercase tracking-widest text-xs hover:text-indigo-300 transition-colors"
                >
                  Initiate first sequence <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 pb-10">
                {user.projects.map((project) => (
                  <div key={project.id} className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden group hover:border-indigo-500/50 transition-all flex flex-col shadow-2xl">
                    <div className="relative aspect-video overflow-hidden bg-black">
                      <img 
                        src={project.thumbnailUrl} 
                        alt={project.title} 
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 opacity-80"
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3 backdrop-blur-sm">
                        <button 
                          onClick={() => {
                            setCurrentProject(project);
                            setView('editor');
                          }}
                          className="bg-white text-black p-4 rounded-full hover:bg-gray-200 active:scale-90 transition-all shadow-xl"
                        >
                          <Play className="w-6 h-6 fill-current" />
                        </button>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteProject(project.id);
                          }}
                          className="bg-red-500 text-white p-4 rounded-full hover:bg-red-600 active:scale-90 transition-all shadow-xl"
                        >
                          <Trash2 className="w-6 h-6" />
                        </button>
                      </div>
                      <div className="absolute bottom-3 right-3 bg-black/80 backdrop-blur-md px-2.5 py-1 rounded text-[10px] font-black uppercase tracking-[0.2em] border border-white/10">
                        {project.duration}s | {project.resolution} {project.audioUrl && '| 🔊'}
                      </div>
                    </div>
                    <div className="p-5 flex-1 flex flex-col gap-1 bg-gradient-to-b from-gray-900 to-black">
                      <h3 className="font-black text-lg line-clamp-1 tracking-tight">{project.title}</h3>
                      <p className="text-[10px] font-black uppercase tracking-widest text-gray-500 flex items-center gap-1.5">
                        <Clock className="w-3 h-3" /> {new Date(project.createdAt).toLocaleDateString()}
                      </p>
                      <div className="mt-5 flex items-center justify-between">
                        <div className="bg-gray-800/80 px-2.5 py-1 rounded text-[10px] font-black uppercase tracking-widest text-gray-400 border border-gray-700">
                          {project.style}
                        </div>
                        <button 
                          onClick={() => {
                            setCurrentProject(project);
                            setView('editor');
                          }}
                          className="text-indigo-400 text-[10px] font-black uppercase tracking-[0.2em] flex items-center gap-1.5 hover:text-indigo-300 transition-colors"
                        >
                          REMIX <RefreshCcw className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="flex-1 flex flex-col lg:grid lg:grid-cols-12 gap-6 lg:gap-10 animate-in slide-in-from-right duration-500 overflow-hidden">
            
            {/* Sidebar Controls */}
            <div className={`
              lg:col-span-4 flex flex-col gap-6 
              ${isSidebarOpen ? 'flex-1' : 'h-0 lg:h-full'} 
              transition-all duration-300 overflow-hidden
            `}>
              <div className="flex items-center gap-3 shrink-0">
                <button 
                  onClick={() => setView('dashboard')}
                  className="p-2.5 bg-gray-900 border border-gray-800 hover:bg-gray-800 rounded-xl transition-all active:scale-95"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <h2 className="text-xl font-black tracking-tight uppercase">Studio Controls</h2>
                <button 
                  onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                  className="lg:hidden ml-auto p-2.5 bg-gray-900 border border-gray-800 rounded-xl"
                >
                  {isSidebarOpen ? <ChevronDown className="w-5 h-5" /> : <ChevronUp className="w-5 h-5" />}
                </button>
              </div>

              {/* Tab Selector */}
              <div className="bg-gray-900 p-1 rounded-2xl border border-gray-800 flex shadow-inner shrink-0">
                <button 
                  onClick={() => setSidebarTab('video')}
                  className={`flex-1 py-2 px-4 rounded-xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 transition-all ${sidebarTab === 'video' ? 'bg-gray-800 text-white shadow-lg' : 'text-gray-500 hover:text-gray-300'}`}
                >
                   <Video className="w-4 h-4" /> Video
                </button>
                <button 
                  onClick={() => setSidebarTab('audio')}
                  className={`flex-1 py-2 px-4 rounded-xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 transition-all ${sidebarTab === 'audio' ? 'bg-gray-800 text-white shadow-lg' : 'text-gray-500 hover:text-gray-300'}`}
                >
                   <Volume2 className="w-4 h-4" /> Audio
                </button>
              </div>

              <div className="flex-1 overflow-y-auto custom-scroll pr-2 space-y-6 pb-24 lg:pb-10">
                {sidebarTab === 'video' ? (
                  <div className="space-y-6 animate-in fade-in duration-300">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                         <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.25em]">Visual Sequence Prompt</label>
                         <button 
                            onClick={() => setGroundingEnabled(!groundingEnabled)}
                            className={`flex items-center gap-2 px-2 py-1 rounded-md border transition-all ${groundingEnabled ? 'bg-indigo-500/10 border-indigo-500 text-indigo-400' : 'bg-gray-800 border-gray-700 text-gray-500'}`}
                         >
                            <Globe className="w-3 h-3" />
                            <span className="text-[8px] font-black uppercase tracking-widest">Grounding {groundingEnabled ? 'ON' : 'OFF'}</span>
                         </button>
                      </div>
                      <textarea
                        value={currentProject.prompt}
                        onChange={(e) => setCurrentProject(prev => ({ ...prev, prompt: e.target.value }))}
                        placeholder="Cinematic drone shot of a futuristic metropolis..."
                        className="w-full h-32 bg-gray-900 border border-gray-800 rounded-[1.5rem] p-5 text-white placeholder-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 resize-none transition-all text-sm font-medium leading-relaxed"
                        maxLength={500}
                      />
                    </div>

                    <div className="space-y-4">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.25em] flex items-center gap-2">
                        <Palette className="w-4 h-4 text-indigo-400" /> Aesthetic Direction
                      </label>
                      <StyleGrid 
                        selectedId={currentProject.style || 'cinematic'} 
                        onSelect={(id) => setCurrentProject(prev => ({ ...prev, style: id }))} 
                      />
                    </div>

                    <div className="space-y-3">
                      <label className="text-[10px] font-black text-gray-500 uppercase tracking-[0.25em] flex items-center gap-2">
                        <Ban className="w-3.5 h-3.5" /> Exclusion Filters
                      </label>
                      <textarea
                        value={currentProject.negativePrompt || ''}
                        onChange={(e) => setCurrentProject(prev => ({ ...prev, negativePrompt: e.target.value }))}
                        placeholder="Blur, watermarks, text, low resolution..."
                        className="w-full h-20 bg-gray-900/50 border border-gray-800 rounded-xl p-4 text-[10px] font-bold text-gray-300 placeholder-gray-700 focus:outline-none focus:ring-1 focus:ring-red-500/30 resize-none transition-all uppercase tracking-wider"
                        maxLength={300}
                      />
                    </div>

                    <div className="space-y-4">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.25em]">Visual Reference Asset</label>
                      <div 
                        onClick={() => fileInputRef.current?.click()}
                        className={`group relative h-40 border-2 border-dashed rounded-[1.5rem] transition-all cursor-pointer flex flex-col items-center justify-center overflow-hidden ${
                          uploadedImage ? 'border-indigo-500 bg-indigo-500/5 shadow-2xl' : 'border-gray-800 hover:border-gray-600 bg-gray-900/50'
                        }`}
                      >
                        {uploadedImage ? (
                          <>
                            <img src={uploadedImage} alt="Ref" className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-sm">
                              <span className="text-[10px] font-black text-white uppercase tracking-[0.3em]">Replace Reference</span>
                            </div>
                          </>
                        ) : (
                          <>
                            <div className="bg-gray-800 p-3 rounded-full mb-2 group-hover:bg-indigo-500/10 transition-colors">
                              <ImageIcon className="w-6 h-6 text-gray-500 group-hover:text-indigo-400 transition-colors" />
                            </div>
                            <p className="text-[10px] text-gray-500 font-black uppercase tracking-widest">Upload Frame</p>
                          </>
                        )}
                      </div>
                      <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleImageUpload} />
                    </div>
                  </div>
                ) : (
                  <div className="space-y-6 animate-in fade-in duration-300">
                    <div className="p-6 bg-indigo-500/5 border border-indigo-500/10 rounded-[2rem] space-y-5 shadow-inner">
                      <label className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.25em] flex items-center gap-2">
                        <Mic className="w-4 h-4" /> Sonic Layering
                      </label>
                      <textarea
                        value={currentProject.audioPrompt || ''}
                        onChange={(e) => setCurrentProject(prev => ({ ...prev, audioPrompt: e.target.value }))}
                        placeholder="Enter script for voice synthesis..."
                        className="w-full h-32 bg-gray-950/50 border border-gray-800 rounded-xl p-4 text-white placeholder-gray-600 focus:outline-none focus:ring-1 focus:ring-indigo-500/50 resize-none transition-all text-sm font-medium leading-relaxed"
                        maxLength={500}
                      />
                      
                      <div className="grid grid-cols-2 gap-2">
                        {VOICES.map(voice => (
                          <button
                            key={voice.id}
                            onClick={() => setCurrentProject(prev => ({ ...prev, selectedVoice: voice.id }))}
                            className={`p-3 rounded-xl border text-left transition-all ${
                              currentProject.selectedVoice === voice.id 
                                ? 'bg-indigo-600 border-indigo-400 text-white shadow-lg shadow-indigo-600/20' 
                                : 'bg-gray-900 border-gray-800 text-gray-400 hover:border-gray-700 hover:bg-gray-800'
                            }`}
                          >
                            <p className="text-[10px] font-black uppercase tracking-widest">{voice.name}</p>
                            <p className="text-[8px] font-bold opacity-50 uppercase mt-0.5">{voice.desc}</p>
                          </button>
                        ))}
                      </div>

                      <button
                        disabled={!currentProject.audioPrompt || !!audioGenMsg}
                        onClick={handleGenerateAudio}
                        className="w-full py-4 bg-gray-800 hover:bg-gray-700 text-white rounded-xl text-[10px] font-black uppercase tracking-[0.2em] flex items-center justify-center gap-2 transition-all disabled:opacity-50 active:scale-95 shadow-xl"
                      >
                        {audioGenMsg ? <Loader2 className="w-4 h-4 animate-spin" /> : <Music className="w-4 h-4" />}
                        {audioGenMsg || 'Generate Audio Stream'}
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <div className="shrink-0 pt-4 border-t border-gray-900/50 mt-auto bg-gray-950/90 backdrop-blur-xl">
                <button
                  disabled={!currentProject.prompt || currentProject.status === 'generating'}
                  onClick={startGeneration}
                  className={`w-full py-5 rounded-[1.5rem] font-black text-sm uppercase tracking-[0.25em] flex items-center justify-center gap-3 transition-all active:scale-95 shadow-2xl ${
                    currentProject.status === 'generating'
                      ? 'bg-gray-800 text-gray-500 cursor-not-allowed'
                      : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-600/40'
                  }`}
                >
                  {currentProject.status === 'generating' ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Rendering...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-5 h-5" />
                      INITIATE RENDER
                    </>
                  )}
                </button>
                {error && <p className="mt-4 text-red-400 text-[10px] font-black uppercase tracking-widest text-center py-3 bg-red-500/10 rounded-xl border border-red-500/20 px-4 mb-4">{error}</p>}
              </div>
            </div>

            {/* Main Preview Screen */}
            <div className={`
              lg:col-span-8 flex flex-col gap-6 h-full min-h-0
              ${!isSidebarOpen ? 'flex-1' : 'h-[40vh] lg:h-full'}
            `}>
              <div className="flex-1 bg-gray-900 border border-gray-800 rounded-[2.5rem] sm:rounded-[3.5rem] overflow-hidden relative shadow-2xl group flex flex-col min-h-[300px]">
                
                {currentProject.status === 'generating' && (
                  <div className="absolute top-0 left-0 w-full h-1.5 z-40 overflow-hidden bg-gray-800">
                    <div className="h-full bg-indigo-500 animate-[progress_60s_linear_infinite] shadow-[0_0_15px_rgba(99,102,241,0.5)]"></div>
                  </div>
                )}

                <div className="flex-1 w-full relative bg-black flex items-center justify-center overflow-hidden">
                  {currentProject.status === 'generating' && (
                    <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-gray-950/95 backdrop-blur-3xl">
                      <div className="relative mb-8 sm:mb-12">
                        <div className="w-32 h-32 sm:w-48 sm:h-48 border-[6px] border-indigo-500/5 border-t-indigo-500 rounded-full animate-[spin_2s_linear_infinite]"></div>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <Sparkles className="w-10 h-10 sm:w-16 sm:h-16 text-indigo-400 animate-pulse" />
                        </div>
                      </div>
                      <div className="text-center space-y-4 px-8 sm:px-12 max-w-lg">
                        <h3 className="text-xl sm:text-3xl font-black tracking-tighter uppercase tracking-[0.3em]">Processing Sequence</h3>
                        <p className="text-indigo-400/80 font-mono text-[9px] sm:text-[10px] uppercase tracking-[0.4em] animate-pulse h-4">{generationMsg}</p>
                      </div>
                    </div>
                  )}

                  {currentProject.videoUrl ? (
                    <div className="relative w-full h-full group/player">
                      <video 
                        src={currentProject.videoUrl} 
                        className="w-full h-full object-contain cursor-pointer"
                        controls
                        autoPlay
                        loop
                        playsInline
                      />
                      
                      <div className="absolute bottom-16 sm:bottom-24 left-6 sm:left-10 flex flex-col items-start gap-1 opacity-20 pointer-events-none select-none group-hover/player:opacity-40 transition-opacity">
                        <div className="flex items-center gap-2">
                          <Sparkles className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
                          <span className="text-[8px] sm:text-[10px] font-black text-white tracking-[0.4em] uppercase">KALEIDOSCOPE AI RENDER</span>
                        </div>
                      </div>
                    </div>
                  ) : currentProject.status !== 'generating' && (
                    <div className="text-center space-y-6 sm:space-y-8 p-12 sm:p-16 max-w-md animate-in fade-in zoom-in duration-700">
                      <div className="mx-auto w-24 h-24 sm:w-28 sm:h-28 bg-indigo-500/5 rounded-[2.5rem] flex items-center justify-center border border-indigo-500/10 shadow-2xl relative overflow-hidden group">
                        <Play className="w-12 h-12 sm:w-14 sm:h-14 text-indigo-400/40" />
                      </div>
                      <h3 className="text-xl sm:text-2xl font-black text-white/40 tracking-tighter uppercase tracking-[0.2em]">Preview Terminal</h3>
                    </div>
                  )}
                </div>

                {/* Toolbar */}
                <div className="bg-black p-4 sm:p-8 flex flex-col sm:flex-row items-center justify-between border-t border-gray-800/50 gap-4">
                  <div className="w-full sm:w-auto flex items-center justify-center sm:justify-start gap-4">
                    {currentProject.audioUrl && (
                      <div className="flex items-center gap-4 bg-indigo-500/5 px-4 sm:px-6 py-2.5 sm:py-3 rounded-full border border-indigo-500/10 shadow-xl w-full sm:w-auto">
                        <audio ref={audioRef} src={currentProject.audioUrl} controls className="h-7 w-full sm:w-40 opacity-40 filter invert grayscale hover:opacity-100" />
                      </div>
                    )}
                  </div>

                  {currentProject.videoUrl && (
                    <div className="flex items-center gap-3 w-full sm:w-auto">
                      <button 
                        onClick={handleExtend}
                        disabled={currentProject.status === 'generating'}
                        className="flex-1 sm:flex-initial bg-gray-800 text-white font-black uppercase tracking-[0.2em] text-[10px] px-6 py-3.5 sm:py-4 rounded-full flex items-center justify-center gap-3 hover:bg-gray-700 transition-all active:scale-95 disabled:opacity-50"
                        title="Add 7 seconds to this production"
                      >
                        <FastForward className="w-4 h-4" /> Extend
                      </button>
                      <button 
                        onClick={() => window.open(currentProject.videoUrl, '_blank')}
                        className="flex-1 sm:flex-initial bg-indigo-600 text-white font-black uppercase tracking-[0.2em] text-[10px] px-8 py-3.5 sm:py-4 rounded-full flex items-center justify-center gap-3 hover:bg-indigo-500 shadow-xl transition-all active:scale-95"
                      >
                        <Download className="w-5 h-5" /> Export
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Archive */}
              <div className="bg-gray-900 border border-gray-800 rounded-[2rem] sm:rounded-[2.5rem] p-6 sm:p-8 mb-6">
                <div className="flex items-center justify-between mb-6">
                  <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-500 flex items-center gap-2.5">
                    <History className="w-4 h-4" /> Production Archive
                  </h4>
                </div>
                <div className="flex gap-4 sm:gap-5 overflow-x-auto pb-4 scrollbar-hide">
                  {currentProject.status === 'generating' && <SkeletonCard />}
                  {user.projects.slice(0, 10).map((p) => (
                    <button
                      key={p.id}
                      onClick={() => setCurrentProject(p)}
                      className={`relative w-40 sm:w-48 aspect-video rounded-2xl overflow-hidden shrink-0 border-2 transition-all ${
                        currentProject.id === p.id ? 'border-indigo-500 shadow-2xl' : 'border-transparent hover:border-gray-700'
                      }`}
                    >
                      <img src={p.thumbnailUrl} className="w-full h-full object-cover" alt="History" />
                      <div className="absolute bottom-2 left-2 bg-black/60 text-[8px] font-black px-1.5 py-0.5 rounded border border-white/10">
                        {p.duration}s
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-900 bg-black/50 py-8 px-6 backdrop-blur-xl shrink-0">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-6">
             <div className="flex items-center gap-2.5 text-gray-600">
               <Sparkles className="w-4 h-4" />
               <span className="text-[9px] font-black uppercase tracking-[0.25em]">Veo 3.1 Advanced</span>
             </div>
             <div className="flex items-center gap-2.5 text-indigo-500">
               <Globe className="w-4 h-4" />
               <span className="text-[9px] font-black uppercase tracking-[0.25em]">Grounding Ready</span>
             </div>
          </div>
          <div className="flex items-center gap-6">
            <div className="flex flex-col items-end">
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-600">{user.tier} TIER</span>
              <span className="text-xs font-black text-indigo-400 tracking-tighter">UNITS: {user.credits}</span>
            </div>
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-[1.25rem] bg-indigo-600/5 border border-indigo-500/20 flex items-center justify-center">
              <User className="w-5 h-5 sm:w-6 sm:h-6 text-indigo-400" />
            </div>
          </div>
        </div>
      </footer>

      <style>{`
        @keyframes progress {
          0% { width: 0%; opacity: 1; }
          95% { width: 98%; opacity: 1; }
          100% { width: 100%; opacity: 0; }
        }
        .custom-scroll::-webkit-scrollbar { width: 4px; }
        .custom-scroll::-webkit-scrollbar-thumb { background: #312e81; border-radius: 10px; }
        .scrollbar-hide::-webkit-scrollbar { display: none; }
      `}</style>
    </div>
  );
};

export default App;