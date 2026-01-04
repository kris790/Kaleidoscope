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
  X
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
  <div className="w-40 aspect-video rounded-xl bg-gray-900 overflow-hidden animate-pulse border border-gray-800">
    <div className="w-full h-full bg-gradient-to-r from-gray-900 via-gray-800/50 to-gray-900"></div>
  </div>
);

const App: React.FC = () => {
  const [view, setView] = useState<'dashboard' | 'editor'>('dashboard');
  const [hasApiKey, setHasApiKey] = useState(true); // Default to true to avoid flashing on load
  const [showKeyPrompt, setShowKeyPrompt] = useState(false);
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
      } else {
        // If window.aistudio is not present, we assume the environment provides process.env.API_KEY
        setHasApiKey(true);
        setShowKeyPrompt(false);
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
        title: currentProject.prompt.slice(0, 30) + '...',
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
            <span className="text-xl font-black tracking-tighter">KALEIDOSCOPE</span>
          </div>

          <div className="hidden md:flex items-center gap-8">
            <button 
              onClick={() => setView('dashboard')}
              className={`flex items-center gap-2 font-bold text-sm uppercase tracking-widest transition-colors ${view === 'dashboard' ? 'text-indigo-400' : 'text-gray-400 hover:text-white'}`}
            >
              <LayoutDashboard className="w-4 h-4" /> Dashboard
            </button>
            <button 
              onClick={handleCreateNew}
              className={`flex items-center gap-2 font-bold text-sm uppercase tracking-widest transition-colors ${view === 'editor' ? 'text-indigo-400' : 'text-gray-400 hover:text-white'}`}
            >
              <Video className="w-4 h-4" /> Create
            </button>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-2 bg-gray-800/50 px-3 py-1.5 rounded-full border border-gray-700">
              <Zap className="w-4 h-4 text-yellow-500 fill-yellow-500" />
              <span className="text-xs font-black tracking-tighter">{user.credits} CREDITS</span>
            </div>
            <button 
              onClick={() => setShowKeyPrompt(true)}
              className="bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] font-black uppercase tracking-widest px-4 py-2 rounded-lg transition-all active:scale-95 shadow-lg shadow-indigo-600/20"
            >
              {hasApiKey ? 'Update Key' : 'Setup API'}
            </button>
          </div>
        </div>
      </nav>

      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
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
              <div className="bg-gray-900/50 border-2 border-dashed border-gray-800 rounded-[2rem] p-24 text-center space-y-6">
                <div className="bg-gray-800 w-24 h-24 rounded-full flex items-center justify-center mx-auto ring-8 ring-gray-900">
                  <Video className="w-12 h-12 text-gray-500" />
                </div>
                <div className="space-y-2">
                  <h2 className="text-2xl font-black tracking-tight">Your library is empty</h2>
                  <p className="text-gray-400 max-w-sm mx-auto font-medium">
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
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
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
                          onClick={() => deleteProject(project.id)}
                          className="bg-red-500 text-white p-4 rounded-full hover:bg-red-600 active:scale-90 transition-all shadow-xl"
                        >
                          <Trash2 className="w-6 h-6" />
                        </button>
                      </div>
                      <div className="absolute bottom-3 right-3 bg-black/80 backdrop-blur-md px-2.5 py-1 rounded text-[10px] font-black uppercase tracking-[0.2em] border border-white/10">
                        {project.duration}s | {project.resolution} {project.audioUrl && '| 🔊'}
                      </div>
                      <div className="absolute top-3 left-3 text-[8px] font-black text-white/40 tracking-[0.4em] pointer-events-none uppercase">
                        K-SCOPE AI RENDER
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
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 animate-in slide-in-from-right duration-500">
            {/* Sidebar Controls */}
            <div className="lg:col-span-4 space-y-6 overflow-y-auto max-h-[calc(100vh-12rem)] pr-4 custom-scroll pb-10">
              <div className="flex items-center gap-3 mb-4">
                <button 
                  onClick={() => setView('dashboard')}
                  className="p-2.5 bg-gray-900 border border-gray-800 hover:bg-gray-800 rounded-xl transition-all active:scale-95"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <h2 className="text-xl font-black tracking-tight uppercase">Studio Controls</h2>
              </div>

              {/* Tab Selector for Video/Audio */}
              <div className="bg-gray-900 p-1.5 rounded-2xl border border-gray-800 flex shadow-inner">
                <button className="flex-1 py-2.5 px-4 rounded-xl bg-gray-800 text-white font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 transition-all">
                   <Video className="w-4 h-4" /> Video
                </button>
                <button className="flex-1 py-2.5 px-4 rounded-xl text-gray-500 hover:text-white font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 transition-all">
                   <Volume2 className="w-4 h-4" /> Audio
                </button>
              </div>

              {/* Video Prompt Input */}
              <div className="space-y-3">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.25em] flex items-center justify-between">
                  Visual Sequence Prompt
                  <span className="text-gray-600">{(currentProject.prompt || '').length}/500</span>
                </label>
                <textarea
                  value={currentProject.prompt}
                  onChange={(e) => setCurrentProject(prev => ({ ...prev, prompt: e.target.value }))}
                  placeholder="Cinematic drone shot of a futuristic metropolis at sunset..."
                  className="w-full h-32 bg-gray-900 border border-gray-800 rounded-[1.5rem] p-5 text-white placeholder-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 resize-none transition-all text-sm font-medium leading-relaxed"
                  maxLength={500}
                />
              </div>

              {/* Style Presets Section */}
              <div className="space-y-4 pt-4 border-t border-gray-800/50">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.25em] flex items-center gap-2">
                  <Palette className="w-4 h-4 text-indigo-400" /> Aesthetic Direction
                </label>
                <StyleGrid 
                  selectedId={currentProject.style || 'cinematic'} 
                  onSelect={(id) => setCurrentProject(prev => ({ ...prev, style: id }))} 
                />
              </div>

              {/* Negative Prompt Input */}
              <div className="space-y-3">
                <label className="text-[10px] font-black text-gray-500 uppercase tracking-[0.25em] flex items-center gap-2">
                  <Ban className="w-3.5 h-3.5" /> Exclusion Filters
                </label>
                <textarea
                  value={currentProject.negativePrompt || ''}
                  onChange={(e) => setCurrentProject(prev => ({ ...prev, negativePrompt: e.target.value }))}
                  placeholder="Unnatural textures, watermarks, text overlays, low resolution..."
                  className="w-full h-20 bg-gray-900/50 border border-gray-800 rounded-xl p-4 text-[10px] font-bold text-gray-300 placeholder-gray-700 focus:outline-none focus:ring-1 focus:ring-red-500/30 resize-none transition-all uppercase tracking-wider"
                  maxLength={300}
                />
              </div>

              {/* Audio Section */}
              <div className="p-6 bg-indigo-500/5 border border-indigo-500/10 rounded-[2rem] space-y-5">
                <label className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.25em] flex items-center gap-2">
                  <Mic className="w-4 h-4" /> Sonic Layering
                </label>
                <textarea
                  value={currentProject.audioPrompt || ''}
                  onChange={(e) => setCurrentProject(prev => ({ ...prev, audioPrompt: e.target.value }))}
                  placeholder="Enter script for voice synthesis..."
                  className="w-full h-24 bg-gray-950/50 border border-gray-800 rounded-xl p-4 text-white placeholder-gray-600 focus:outline-none focus:ring-1 focus:ring-indigo-500/50 resize-none transition-all text-sm font-medium"
                  maxLength={500}
                />
                
                <div className="grid grid-cols-2 gap-2.5">
                  {VOICES.map(voice => (
                    <button
                      key={voice.id}
                      onClick={() => setCurrentProject(prev => ({ ...prev, selectedVoice: voice.id }))}
                      className={`p-3 rounded-xl border text-left transition-all ${
                        currentProject.selectedVoice === voice.id 
                          ? 'bg-indigo-600 border-indigo-400 text-white shadow-lg shadow-indigo-600/20' 
                          : 'bg-gray-900 border-gray-800 text-gray-400 hover:border-gray-700'
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
                  className="w-full py-3.5 bg-gray-800 hover:bg-gray-700 text-white rounded-xl text-[10px] font-black uppercase tracking-[0.2em] flex items-center justify-center gap-2 transition-all disabled:opacity-50 active:scale-95"
                >
                  {audioGenMsg ? <Loader2 className="w-4 h-4 animate-spin" /> : <Music className="w-4 h-4" />}
                  {audioGenMsg || 'Generate Audio Stream'}
                </button>
              </div>

              {/* Image Input */}
              <div className="space-y-4">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.25em]">Visual Reference Asset</label>
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className={`group relative h-48 border-2 border-dashed rounded-[1.5rem] transition-all cursor-pointer flex flex-col items-center justify-center overflow-hidden ${
                    uploadedImage ? 'border-indigo-500 bg-indigo-500/5 shadow-2xl shadow-indigo-500/10' : 'border-gray-800 hover:border-gray-600 bg-gray-900/50'
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
                      <div className="bg-gray-800 p-4 rounded-full mb-3 group-hover:bg-indigo-500/10 transition-colors">
                        <ImageIcon className="w-8 h-8 text-gray-500 group-hover:text-indigo-400 transition-colors" />
                      </div>
                      <p className="text-[10px] text-gray-500 font-black uppercase tracking-widest">Upload Source Image</p>
                    </>
                  )}
                </div>
                <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleImageUpload} />
              </div>

              {/* Final Generate Video Button */}
              <div className="pt-6 sticky bottom-0 bg-gray-950/90 backdrop-blur-xl pb-6 mt-4 border-t border-gray-900">
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
                {error && <p className="mt-4 text-red-400 text-[10px] font-black uppercase tracking-widest text-center py-3 bg-red-500/10 rounded-xl border border-red-500/20 px-4">{error}</p>}
              </div>
            </div>

            {/* Main Preview Screen */}
            <div className="lg:col-span-8 flex flex-col h-full space-y-8">
              <div className="flex-1 bg-gray-900 border border-gray-800 rounded-[3rem] overflow-hidden relative shadow-2xl group flex flex-col min-h-[500px]">
                
                {/* Rendering Progress Bar */}
                {currentProject.status === 'generating' && (
                  <div className="absolute top-0 left-0 w-full h-1.5 z-30 overflow-hidden bg-gray-800">
                    <div className="h-full bg-indigo-500 animate-[progress_45s_ease-in-out_infinite] shadow-[0_0_15px_rgba(99,102,241,0.5)]"></div>
                  </div>
                )}

                {/* Video Player Area */}
                <div className="flex-1 w-full relative bg-black flex items-center justify-center">
                  {currentProject.status === 'generating' && (
                    <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-gray-950/95 backdrop-blur-3xl">
                      <div className="relative mb-10">
                        <div className="w-40 h-40 border-[6px] border-indigo-500/5 border-t-indigo-500 rounded-full animate-[spin_2s_linear_infinite]"></div>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <Sparkles className="w-12 h-12 text-indigo-400 animate-pulse" />
                        </div>
                      </div>
                      <div className="text-center space-y-4 px-12 max-w-lg">
                        <h3 className="text-3xl font-black tracking-tighter uppercase tracking-[0.3em]">Processing Frames</h3>
                        <p className="text-indigo-400/80 font-mono text-[10px] uppercase tracking-[0.4em] animate-pulse">{generationMsg}</p>
                        <div className="flex justify-center gap-1.5 pt-2">
                           {[0, 1, 2, 3].map(i => (
                             <div key={i} className="w-1 h-1 bg-indigo-500 rounded-full animate-bounce" style={{animationDelay: `${i * 0.1}s`}}></div>
                           ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {currentProject.videoUrl ? (
                    <div className="relative w-full h-full group/player overflow-hidden">
                      <video 
                        src={currentProject.videoUrl} 
                        className="w-full h-full object-contain"
                        controls
                        autoPlay
                        loop
                      />
                      
                      {/* Safety Watermark (Responsible AI) */}
                      <div className="absolute bottom-20 left-10 flex flex-col items-start gap-1 opacity-20 pointer-events-none select-none group-hover/player:opacity-40 transition-opacity">
                        <div className="flex items-center gap-2">
                          <Sparkles className="w-4 h-4 text-white" />
                          <span className="text-[10px] font-black text-white tracking-[0.4em] uppercase">KALEIDOSCOPE AI RENDER</span>
                        </div>
                        <div className="text-[8px] font-bold text-white tracking-[0.2em] uppercase">ENGINE: VEO 3.1 ALPHA</div>
                      </div>

                      {/* Safety Moderation Badge */}
                      <div className="absolute top-6 right-6 bg-black/60 backdrop-blur-xl border border-white/10 p-2.5 rounded-2xl opacity-0 group-hover/player:opacity-100 transition-all transform translate-y-2 group-hover/player:translate-y-0 flex items-center gap-2.5 shadow-2xl">
                        <div className="bg-indigo-500/20 p-1.5 rounded-lg">
                          <ShieldAlert className="w-4 h-4 text-indigo-400" />
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[10px] text-white font-black uppercase tracking-widest">Safety Verified</span>
                          <span className="text-[8px] text-gray-500 font-bold uppercase">Pixel-Level Moderation Active</span>
                        </div>
                      </div>

                      {/* Video Info Overlay */}
                      <div className="absolute bottom-6 right-6 flex items-center gap-4">
                        <div className="bg-black/60 backdrop-blur-md border border-white/5 px-3 py-1.5 rounded-full text-[9px] font-black text-gray-400 uppercase tracking-widest">
                          {currentProject.resolution} @ 24FPS
                        </div>
                      </div>
                    </div>
                  ) : currentProject.status !== 'generating' && (
                    <div className="text-center space-y-8 p-16 max-w-md animate-in fade-in zoom-in duration-700">
                      <div className="mx-auto w-28 h-28 bg-indigo-500/5 rounded-[2.5rem] flex items-center justify-center border border-indigo-500/10 shadow-2xl shadow-indigo-500/5 relative overflow-hidden group">
                        <div className="absolute inset-0 bg-indigo-500/10 translate-y-full group-hover:translate-y-0 transition-transform duration-500"></div>
                        <Play className="w-14 h-14 text-indigo-400/40 relative z-10" />
                      </div>
                      <div className="space-y-3">
                        <h3 className="text-2xl font-black text-white/40 tracking-tighter uppercase tracking-[0.2em]">Preview Monitor</h3>
                        <p className="text-gray-600 leading-relaxed text-sm font-bold uppercase tracking-widest">
                          Configure your cinematic parameters to initiate rendering
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Combined Audio/Video Toolbar */}
                <div className="bg-black p-8 flex items-center justify-between border-t border-gray-800/50">
                  <div className="flex items-center gap-8">
                    {currentProject.audioUrl && (
                      <div className="flex items-center gap-5 bg-indigo-500/5 px-6 py-3 rounded-[2rem] border border-indigo-500/10 shadow-xl group">
                        <div className="flex flex-col">
                          <div className="flex gap-2 items-center">
                            <Waves className="w-4 h-4 text-indigo-400 animate-pulse" />
                            <span className="text-[10px] font-black text-indigo-300 uppercase tracking-[0.2em]">Master Audio Track</span>
                          </div>
                        </div>
                        <audio ref={audioRef} src={currentProject.audioUrl} controls className="h-8 w-48 opacity-40 filter invert grayscale hover:opacity-100 transition-opacity" />
                      </div>
                    )}
                  </div>

                  {currentProject.videoUrl && (
                    <div className="flex items-center gap-4">
                      <button 
                        onClick={() => window.open(currentProject.videoUrl, '_blank')}
                        className="bg-indigo-600 text-white font-black uppercase tracking-[0.2em] text-[10px] px-10 py-4 rounded-full flex items-center gap-3 hover:bg-indigo-500 shadow-[0_10px_30px_rgba(79,70,229,0.3)] transition-all hover:scale-105 active:scale-95"
                      >
                        <Download className="w-5 h-5" /> Export Sequence
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* History Bar with Skeletons */}
              <div className="bg-gray-900 border border-gray-800 rounded-[2.5rem] p-8">
                <div className="flex items-center justify-between mb-6">
                  <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-500 flex items-center gap-2.5">
                    <History className="w-4 h-4" /> Production Archive
                  </h4>
                  <button className="text-[10px] font-black text-indigo-400 hover:text-indigo-300 uppercase tracking-widest border-b border-indigo-400/20 pb-0.5">Browse Archive</button>
                </div>
                <div className="flex gap-5 overflow-x-auto pb-4 scrollbar-hide">
                  {currentProject.status === 'generating' && <SkeletonCard />}
                  {user.projects.slice(0, 10).map((p) => (
                    <button
                      key={p.id}
                      onClick={() => setCurrentProject(p)}
                      className={`relative w-48 aspect-video rounded-2xl overflow-hidden shrink-0 border-2 transition-all ${
                        currentProject.id === p.id ? 'border-indigo-500 shadow-2xl shadow-indigo-500/20' : 'border-transparent hover:border-gray-700'
                      }`}
                    >
                      <img src={p.thumbnailUrl} className="w-full h-full object-cover grayscale-[0.3] hover:grayscale-0 transition-all duration-500" alt="History" />
                      <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent"></div>
                      <div className="absolute bottom-2 left-2 bg-black/60 backdrop-blur-sm text-[8px] font-black px-1.5 py-0.5 rounded border border-white/10 uppercase tracking-tighter">
                        {p.duration}s
                      </div>
                    </button>
                  ))}
                  {user.projects.length === 0 && currentProject.status !== 'generating' && (
                    <div className="w-full flex items-center justify-center py-6 text-gray-700 uppercase tracking-[0.4em] text-[10px] font-black border-2 border-dashed border-gray-800 rounded-[1.5rem] bg-black/20">
                      Archive Repository Empty
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-900 bg-black/50 py-10 px-6 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="flex flex-wrap items-center justify-center md:justify-start gap-10">
             <div className="flex items-center gap-2.5 text-gray-600 hover:text-gray-400 transition-colors cursor-help">
               <Sparkles className="w-4 h-4" />
               <span className="text-[9px] font-black uppercase tracking-[0.3em]">Core: Gemini Veo 3.1 Fast</span>
             </div>
             <div className="flex items-center gap-2.5 text-gray-600 hover:text-indigo-400/60 transition-colors cursor-help">
               <ShieldAlert className="w-4 h-4" />
               <span className="text-[9px] font-black uppercase tracking-[0.3em]">Security: Moderation Layer Active</span>
             </div>
             <div className="flex items-center gap-2.5 text-gray-600">
               <Layers className="w-4 h-4" />
               <span className="text-[9px] font-black uppercase tracking-[0.3em]">Build: v1.0.4-Alpha</span>
             </div>
          </div>
          <div className="flex items-center gap-6">
            <div className="flex flex-col items-end">
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-600">{user.tier} ACCESS LEVEL</span>
              <span className="text-xs font-black text-indigo-400 tracking-tighter">REMAINING UNITS: {user.credits}</span>
            </div>
            <div className="w-12 h-12 rounded-[1.25rem] bg-indigo-600/5 border border-indigo-500/20 flex items-center justify-center shadow-inner group hover:border-indigo-500/40 transition-all cursor-pointer">
              <User className="w-6 h-6 text-indigo-400 group-hover:scale-110 transition-transform" />
            </div>
          </div>
        </div>
      </footer>

      <style>{`
        @keyframes progress {
          0% { width: 0%; opacity: 1; }
          90% { width: 98%; opacity: 1; }
          100% { width: 100%; opacity: 0; }
        }
        .custom-scroll::-webkit-scrollbar {
          width: 5px;
        }
        .custom-scroll::-webkit-scrollbar-track {
          background: rgba(0,0,0,0.1);
        }
        .custom-scroll::-webkit-scrollbar-thumb {
          background: #312e81;
          border-radius: 20px;
        }
        .custom-scroll::-webkit-scrollbar-thumb:hover {
          background: #4338ca;
        }
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        /* Glassmorphism utility */
        .glass {
          background: rgba(17, 24, 39, 0.7);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          border: 1px solid rgba(255, 255, 255, 0.05);
        }
      `}</style>
    </div>
  );
};

export default App;