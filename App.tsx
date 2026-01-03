
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
  Palette
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

const App: React.FC = () => {
  const [view, setView] = useState<'dashboard' | 'editor'>('dashboard');
  const [hasApiKey, setHasApiKey] = useState(false);
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
        prompt: currentProject.prompt!,
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
      } else {
        setError(err.message || "Something went wrong during generation.");
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
    <div className="min-h-screen flex flex-col bg-gray-950 text-gray-100">
      {!hasApiKey && <ApiKeyPrompt onKeySelected={() => setHasApiKey(true)} />}

      {/* Navigation */}
      <nav className="border-b border-gray-800 bg-gray-900/50 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => setView('dashboard')}>
            <div className="bg-indigo-600 p-2 rounded-lg">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-bold tracking-tight">KALEIDOSCOPE</span>
          </div>

          <div className="hidden md:flex items-center gap-8">
            <button 
              onClick={() => setView('dashboard')}
              className={`flex items-center gap-2 font-medium transition-colors ${view === 'dashboard' ? 'text-indigo-400' : 'text-gray-400 hover:text-white'}`}
            >
              <LayoutDashboard className="w-4 h-4" /> Dashboard
            </button>
            <button 
              onClick={handleCreateNew}
              className={`flex items-center gap-2 font-medium transition-colors ${view === 'editor' ? 'text-indigo-400' : 'text-gray-400 hover:text-white'}`}
            >
              <Video className="w-4 h-4" /> Create
            </button>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-2 bg-gray-800 px-3 py-1.5 rounded-full border border-gray-700">
              <Zap className="w-4 h-4 text-yellow-500 fill-yellow-500" />
              <span className="text-sm font-semibold">{user.credits} Credits</span>
            </div>
            <button className="bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-bold px-4 py-2 rounded-lg transition-all active:scale-95 shadow-lg shadow-indigo-600/20">
              Upgrade
            </button>
          </div>
        </div>
      </nav>

      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {view === 'dashboard' ? (
          <div className="space-y-8 animate-in fade-in duration-500">
            <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
              <div>
                <h1 className="text-3xl font-bold">Project Library</h1>
                <p className="text-gray-400 mt-1">Manage and remix your cinematic creations</p>
              </div>
              <button 
                onClick={handleCreateNew}
                className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-6 py-3 rounded-xl flex items-center gap-2 transition-all active:scale-95"
              >
                <Plus className="w-5 h-5" /> New Project
              </button>
            </header>

            {user.projects.length === 0 ? (
              <div className="bg-gray-900/50 border-2 border-dashed border-gray-800 rounded-3xl p-16 text-center space-y-6">
                <div className="bg-gray-800 w-20 h-20 rounded-full flex items-center justify-center mx-auto">
                  <Video className="w-10 h-10 text-gray-500" />
                </div>
                <div className="space-y-2">
                  <h2 className="text-xl font-semibold">No videos yet</h2>
                  <p className="text-gray-400 max-w-sm mx-auto">
                    Start creating with Kaleidoscope's high-fidelity text-to-video tools.
                  </p>
                </div>
                <button 
                  onClick={handleCreateNew}
                  className="inline-flex items-center gap-2 text-indigo-400 font-bold hover:text-indigo-300 transition-colors"
                >
                  Create your first clip <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {user.projects.map((project) => (
                  <div key={project.id} className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden group hover:border-indigo-500/50 transition-all flex flex-col">
                    <div className="relative aspect-video overflow-hidden">
                      <img 
                        src={project.thumbnailUrl} 
                        alt={project.title} 
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                        <button 
                          onClick={() => {
                            setCurrentProject(project);
                            setView('editor');
                          }}
                          className="bg-white text-black p-3 rounded-full hover:bg-gray-200 active:scale-90 transition-all"
                        >
                          <Play className="w-6 h-6 fill-current" />
                        </button>
                        <button 
                          onClick={() => deleteProject(project.id)}
                          className="bg-red-500 text-white p-3 rounded-full hover:bg-red-600 active:scale-90 transition-all"
                        >
                          <Trash2 className="w-6 h-6" />
                        </button>
                      </div>
                      <div className="absolute bottom-2 right-2 bg-black/60 backdrop-blur-md px-2 py-1 rounded text-[10px] font-bold uppercase tracking-widest border border-white/10">
                        {project.duration}s | {project.resolution} {project.audioUrl && '| 🔊'}
                      </div>
                    </div>
                    <div className="p-4 flex-1 flex flex-col gap-1">
                      <h3 className="font-bold text-lg line-clamp-1">{project.title}</h3>
                      <p className="text-xs text-gray-500 flex items-center gap-1">
                        <Clock className="w-3 h-3" /> {new Date(project.createdAt).toLocaleDateString()}
                      </p>
                      <div className="mt-4 flex items-center justify-between">
                        <div className="bg-gray-800 px-2 py-1 rounded text-[10px] font-bold uppercase text-gray-400">
                          {project.style}
                        </div>
                        <button 
                          onClick={() => {
                            setCurrentProject(project);
                            setView('editor');
                          }}
                          className="text-indigo-400 text-sm font-bold flex items-center gap-1 hover:text-indigo-300"
                        >
                          Remix <RefreshCcw className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-in slide-in-from-right duration-500">
            {/* Sidebar Controls */}
            <div className="lg:col-span-4 space-y-6 overflow-y-auto max-h-[calc(100vh-12rem)] pr-2 custom-scroll pb-10">
              <div className="flex items-center gap-2 mb-2">
                <button 
                  onClick={() => setView('dashboard')}
                  className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <h2 className="text-xl font-bold">Studio Controls</h2>
              </div>

              {/* Tab Selector for Video/Audio */}
              <div className="bg-gray-900 p-1 rounded-xl border border-gray-800 flex">
                <button className="flex-1 py-2 px-4 rounded-lg bg-gray-800 text-white font-bold text-sm flex items-center justify-center gap-2">
                   <Video className="w-4 h-4" /> Video
                </button>
                <button className="flex-1 py-2 px-4 rounded-lg text-gray-400 hover:text-white font-bold text-sm flex items-center justify-center gap-2">
                   <Volume2 className="w-4 h-4" /> Audio
                </button>
              </div>

              {/* Video Prompt Input */}
              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-400 uppercase tracking-widest flex items-center justify-between">
                  Visual Prompt
                </label>
                <textarea
                  value={currentProject.prompt}
                  onChange={(e) => setCurrentProject(prev => ({ ...prev, prompt: e.target.value }))}
                  placeholder="Describe your scene..."
                  className="w-full h-24 bg-gray-900 border border-gray-800 rounded-2xl p-4 text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 resize-none transition-all"
                  maxLength={500}
                />
              </div>

              {/* Style Presets Section */}
              <div className="space-y-4 pt-2 border-t border-gray-800/50">
                <label className="text-sm font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                  <Palette className="w-4 h-4 text-indigo-400" /> Style Presets
                </label>
                <StyleGrid 
                  selectedId={currentProject.style || 'cinematic'} 
                  onSelect={(id) => setCurrentProject(prev => ({ ...prev, style: id }))} 
                />
              </div>

              {/* Negative Prompt Input */}
              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-500 uppercase tracking-widest flex items-center gap-2">
                  <Ban className="w-3.5 h-3.5" /> Negative Prompt
                </label>
                <textarea
                  value={currentProject.negativePrompt || ''}
                  onChange={(e) => setCurrentProject(prev => ({ ...prev, negativePrompt: e.target.value }))}
                  placeholder="Elements to avoid (e.g. text, blur, low quality, morphing)..."
                  className="w-full h-16 bg-gray-900/50 border border-gray-800 rounded-2xl p-3 text-sm text-gray-300 placeholder-gray-700 focus:outline-none focus:ring-1 focus:ring-red-500/30 resize-none transition-all"
                  maxLength={300}
                />
              </div>

              {/* Audio Section */}
              <div className="p-5 bg-indigo-500/5 border border-indigo-500/20 rounded-2xl space-y-4">
                <label className="text-sm font-bold text-indigo-400 uppercase tracking-widest flex items-center gap-2">
                  <Mic className="w-4 h-4" /> Voiceover / SFX
                </label>
                <textarea
                  value={currentProject.audioPrompt || ''}
                  onChange={(e) => setCurrentProject(prev => ({ ...prev, audioPrompt: e.target.value }))}
                  placeholder="Enter script or sound description... (e.g., 'Say cheerfully: Welcome to the future!')"
                  className="w-full h-20 bg-gray-900 border border-gray-800 rounded-xl p-3 text-white placeholder-gray-600 focus:outline-none focus:ring-1 focus:ring-indigo-500/50 resize-none transition-all text-sm"
                  maxLength={500}
                />
                
                <div className="grid grid-cols-2 gap-2">
                  {VOICES.map(voice => (
                    <button
                      key={voice.id}
                      onClick={() => setCurrentProject(prev => ({ ...prev, selectedVoice: voice.id }))}
                      className={`p-2 rounded-lg border text-left transition-all ${
                        currentProject.selectedVoice === voice.id 
                          ? 'bg-indigo-600 border-indigo-400 text-white' 
                          : 'bg-gray-900 border-gray-800 text-gray-400 hover:border-gray-700'
                      }`}
                    >
                      <p className="text-xs font-bold">{voice.name}</p>
                      <p className="text-[10px] opacity-70">{voice.desc}</p>
                    </button>
                  ))}
                </div>

                <button
                  disabled={!currentProject.audioPrompt || !!audioGenMsg}
                  onClick={handleGenerateAudio}
                  className="w-full py-3 bg-gray-800 hover:bg-gray-700 text-white rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                >
                  {audioGenMsg ? <RefreshCcw className="w-4 h-4 animate-spin" /> : <Music className="w-4 h-4" />}
                  {audioGenMsg || 'Generate Audio'}
                </button>
              </div>

              {/* Image Input */}
              <div className="space-y-3">
                <label className="text-sm font-bold text-gray-400 uppercase tracking-widest">Image Reference</label>
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className={`group relative h-40 border-2 border-dashed rounded-2xl transition-all cursor-pointer flex flex-col items-center justify-center overflow-hidden ${
                    uploadedImage ? 'border-indigo-500 bg-indigo-500/5' : 'border-gray-800 hover:border-gray-700 bg-gray-900/50'
                  }`}
                >
                  {uploadedImage ? (
                    <>
                      <img src={uploadedImage} alt="Ref" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <span className="text-xs font-bold text-white uppercase tracking-widest">Change Image</span>
                      </div>
                    </>
                  ) : (
                    <>
                      <ImageIcon className="w-8 h-8 text-gray-600 mb-2 group-hover:text-indigo-400 transition-colors" />
                      <p className="text-xs text-gray-500 font-medium">Click to upload reference image</p>
                    </>
                  )}
                </div>
                <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleImageUpload} />
              </div>

              {/* Final Generate Video Button */}
              <div className="pt-4 sticky bottom-0 bg-gray-950/80 backdrop-blur-sm pb-4">
                <button
                  disabled={!currentProject.prompt || currentProject.status === 'generating'}
                  onClick={startGeneration}
                  className={`w-full py-5 rounded-2xl font-bold text-lg flex items-center justify-center gap-3 transition-all active:scale-95 shadow-2xl ${
                    currentProject.status === 'generating'
                      ? 'bg-gray-800 text-gray-500 cursor-not-allowed'
                      : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-600/30'
                  }`}
                >
                  {currentProject.status === 'generating' ? (
                    <>
                      <RefreshCcw className="w-5 h-5 animate-spin" />
                      {generationMsg || 'Processing...'}
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-5 h-5" />
                      Generate Video Clip
                    </>
                  )}
                </button>
                {error && <p className="mt-3 text-red-400 text-sm text-center font-medium bg-red-500/10 py-2 rounded-lg border border-red-500/20">{error}</p>}
              </div>
            </div>

            {/* Main Preview Screen */}
            <div className="lg:col-span-8 flex flex-col h-full space-y-6">
              <div className="flex-1 bg-gray-900 border border-gray-800 rounded-[2.5rem] overflow-hidden relative shadow-2xl group flex flex-col">
                
                {/* Video Player */}
                <div className="flex-1 w-full relative bg-black flex items-center justify-center">
                  {currentProject.status === 'generating' && (
                    <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-gray-900/90 backdrop-blur-xl">
                      <div className="relative mb-8">
                        <div className="w-24 h-24 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin"></div>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <Sparkles className="w-8 h-8 text-indigo-400 animate-pulse" />
                        </div>
                      </div>
                      <div className="text-center space-y-2">
                        <h3 className="text-2xl font-bold tracking-tight text-white">Crafting Masterpiece</h3>
                        <p className="text-indigo-400 font-medium animate-pulse">{generationMsg}</p>
                      </div>
                    </div>
                  )}

                  {currentProject.videoUrl ? (
                    <video 
                      src={currentProject.videoUrl} 
                      className="w-full h-full object-contain"
                      controls
                      autoPlay
                      loop
                    />
                  ) : (
                    <div className="text-center space-y-6 p-12 max-w-md">
                      <div className="mx-auto w-24 h-24 bg-indigo-500/10 rounded-full flex items-center justify-center">
                        <Play className="w-12 h-12 text-indigo-400 fill-indigo-400" />
                      </div>
                      <div className="space-y-2">
                        <h3 className="text-xl font-bold text-white">Preview Window</h3>
                        <p className="text-gray-500 leading-relaxed">
                          Enter your creative prompt on the left to begin the generation process.
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Combined Audio/Video Toolbar */}
                <div className="bg-gray-900 p-6 flex items-center justify-between border-t border-gray-800">
                  <div className="flex items-center gap-6">
                    {currentProject.audioUrl && (
                      <div className="flex items-center gap-3 bg-indigo-500/10 px-4 py-2 rounded-full border border-indigo-500/20">
                        <div className="flex gap-1 items-center">
                          <Waves className="w-4 h-4 text-indigo-400" />
                          <span className="text-xs font-bold text-indigo-300 uppercase tracking-tighter">Audio Track</span>
                        </div>
                        <audio ref={audioRef} src={currentProject.audioUrl} controls className="h-8 w-48 opacity-80" />
                      </div>
                    )}
                  </div>

                  {currentProject.videoUrl && (
                    <div className="flex items-center gap-3">
                      <button 
                        onClick={() => window.open(currentProject.videoUrl, '_blank')}
                        className="bg-indigo-600 text-white font-bold px-6 py-3 rounded-full flex items-center gap-2 hover:bg-indigo-500 shadow-xl transition-all"
                      >
                        <Download className="w-5 h-5" /> Export MP4
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* History Bar */}
              <div className="bg-gray-900 border border-gray-800 rounded-3xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-sm font-bold uppercase tracking-widest text-gray-500 flex items-center gap-2">
                    <History className="w-4 h-4" /> Recent Works
                  </h4>
                  <button className="text-xs font-bold text-indigo-400 hover:text-indigo-300">View All</button>
                </div>
                <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
                  {user.projects.slice(0, 8).map((p) => (
                    <button
                      key={p.id}
                      onClick={() => setCurrentProject(p)}
                      className={`relative w-40 aspect-video rounded-xl overflow-hidden shrink-0 border-2 transition-all ${
                        currentProject.id === p.id ? 'border-indigo-500' : 'border-transparent hover:border-gray-700'
                      }`}
                    >
                      <img src={p.thumbnailUrl} className="w-full h-full object-cover" alt="History" />
                    </button>
                  ))}
                  {user.projects.length === 0 && <div className="w-full flex items-center justify-center py-4 text-gray-600 italic text-sm">No recent generations</div>}
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-900 bg-black/30 py-8 px-4">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-gray-500">
            <Sparkles className="w-4 h-4" />
            <span className="text-xs font-bold uppercase tracking-widest">Powered by Gemini Engine</span>
          </div>
          <div className="flex items-center gap-4">
            <div className="w-8 h-8 rounded-full bg-indigo-600/20 flex items-center justify-center">
              <User className="w-4 h-4 text-indigo-400" />
            </div>
            <span className="text-sm font-semibold">{user.tier} Plan</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;
