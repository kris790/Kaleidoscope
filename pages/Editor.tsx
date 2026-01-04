
import React, { useState, useRef, useMemo } from 'react';
import { 
  Palette, Volume2, Globe, Layers, ImageIcon, Mic, 
  Music, Loader2, Terminal, FastForward, Info, Plus, 
  Download, Play, ChevronLeft, VolumeX, Activity, Clock, Zap,
  Video, UserPlus, Users, Cloud
} from 'lucide-react';
import { Project, UserState, UserTier, SpeakerConfig } from '../types';
import { STYLE_PRESETS, TIER_CONFIG, CAMERA_MOVEMENTS } from '../constants';
import { GeminiService } from '../services/geminiService';
import StyleGrid from '../components/StyleGrid';
import TerminalLog from '../components/editor/TerminalLog';
import CloudConsole from '../components/editor/CloudConsole';

interface EditorProps {
  project: Partial<Project>;
  user: UserState;
  setUser: React.Dispatch<React.SetStateAction<UserState>>;
  setCurrentProject: React.Dispatch<React.SetStateAction<Partial<Project>>>;
  setView: (view: any) => void;
}

const VOICES = [
  { id: 'Kore', name: 'Kore', desc: 'Narrator' },
  { id: 'Puck', name: 'Puck', desc: 'Energetic' },
  { id: 'Charon', name: 'Charon', desc: 'Deep' },
  { id: 'Zephyr', name: 'Zephyr', desc: 'Smooth' },
  { id: 'Fenrir', name: 'Fenrir', desc: 'Bold' }
];

const Editor: React.FC<EditorProps> = ({ project, user, setUser, setCurrentProject, setView }) => {
  const [sidebarTab, setSidebarTab] = useState<'visual' | 'audio' | 'cloud'>('visual');
  const [groundingEnabled, setGroundingEnabled] = useState(false);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [logMessages, setLogMessages] = useState<string[]>([]);
  const [isSynthesizingAudio, setIsSynthesizingAudio] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mainVideoRef = useRef<HTMLVideoElement>(null);

  const addLog = (msg: string) => setLogMessages(prev => [...prev.slice(-20), msg]);

  const startInitialGeneration = async () => {
    if (!project.prompt) return;
    const cost = 100;
    if (user.credits < cost) {
      setError("INSUFFICIENT_UNITS: Upgrade tier or add credits.");
      return;
    }

    setError(null);
    setCurrentProject(prev => ({ ...prev, status: 'generating' }));
    setLogMessages(["SYSTEM_BOOT_VEO_OS_3.1", "AUTHENTICATING_PRO_PROTOCOL"]);

    const style = STYLE_PRESETS.find(s => s.id === project.style);
    const camera = CAMERA_MOVEMENTS.find(c => c.id === (project.cameraMovement || 'static'));
    let fullPrompt = `${project.prompt}${style?.promptSuffix || ''}. ${camera?.prompt || ''}`;
    
    try {
      const result = await GeminiService.generateInitialClip({
        prompt: fullPrompt,
        tier: user.tier,
        image: uploadedImage || undefined,
        grounding: groundingEnabled,
        onProgress: (msg) => addLog(msg)
      });

      const updatedProject: Project = {
        ...(project as Project),
        enhancedPrompt: result.enhancedPrompt,
        groundingSources: result.groundingSources,
        clips: [result.clip],
        status: 'completed',
        createdAt: Date.now(),
        resolution: TIER_CONFIG[user.tier].resolution
      };

      setUser(prev => ({
        ...prev,
        credits: prev.credits - cost,
        projects: [updatedProject, ...prev.projects.filter(p => p.id !== updatedProject.id)]
      }));
      setCurrentProject(updatedProject);
      addLog("SUCCESS: INITIAL_CLIP_PERSISTED");
    } catch (err: any) {
      setError(err.message || "RENDER_PIPELINE_ERROR");
      setCurrentProject(prev => ({ ...prev, status: 'failed' }));
    }
  };

  const extendTimeline = async () => {
    if (!project.clips?.length || !project.prompt) return;
    const cost = 150; 
    if (user.credits < cost) {
      setError("INSUFFICIENT_UNITS: Expansion requires 150 units.");
      return;
    }

    setError(null);
    const lastClip = project.clips[project.clips.length - 1];
    setCurrentProject(prev => ({ ...prev, status: 'generating' }));
    setLogMessages(["RECURSIVE_EXPANSION_INIT", "SAMPLING_LATENT_MOTION"]);
    
    try {
      const nextClip = await GeminiService.extendClip({
        prompt: `Continue the scene naturally: ${project.prompt}`,
        lastClip: lastClip,
        onProgress: (msg) => addLog(msg)
      });
      
      const updatedProject = { 
        ...project, 
        clips: [...(project.clips || []), nextClip],
        status: 'completed' as const
      };
      
      setCurrentProject(updatedProject);
      setUser(prev => ({
        ...prev,
        credits: prev.credits - cost,
        projects: prev.projects.map(p => p.id === updatedProject.id ? (updatedProject as Project) : p)
      }));
      addLog("TIMELINE_EXTENDED_+7S");
    } catch (err: any) {
      setError("EXTENSION_CORE_FAILED: " + err.message);
      setCurrentProject(prev => ({ ...prev, status: 'completed' }));
    }
  };

  const handleSynthesizeAudio = async () => {
    if (!project.audioPrompt) return;
    const cost = 50;
    if (user.credits < cost) {
      setError("INSUFFICIENT_UNITS: Audio synthesis requires 50 units.");
      return;
    }

    setIsSynthesizingAudio(true);
    setError(null);
    addLog("INITIATING_SONIC_SYNTHESIS");
    
    try {
      const audioUrl = await GeminiService.synthesizeAudio({
        prompt: project.audioPrompt,
        voiceName: project.selectedVoice || 'Zephyr',
        speakers: project.isMultiSpeaker ? project.speakers : undefined
      });

      const updatedProject = { ...project, audioUrl } as Project;
      setCurrentProject(updatedProject);
      setUser(prev => ({
        ...prev,
        credits: prev.credits - cost,
        projects: prev.projects.map(p => p.id === updatedProject.id ? updatedProject : p)
      }));
      addLog("SONIC_LAYER_SYNTHESIZED_SUCCESSFULLY");
    } catch (err: any) {
      setError("AUDIO_SYNTHESIS_FAILED: " + err.message);
    } finally {
      setIsSynthesizingAudio(false);
    }
  };

  const activeClip = useMemo(() => {
    if (!project.clips?.length) return null;
    return project.clips[project.clips.length - 1];
  }, [project.clips]);

  const totalDuration = useMemo(() => {
    return project.clips?.reduce((acc, c) => acc + c.duration, 0) || 0;
  }, [project.clips]);

  const updateSpeaker = (idx: number, updates: Partial<SpeakerConfig>) => {
    const speakers = [...(project.speakers || [{name: 'Joe', voiceId: 'Kore'}, {name: 'Jane', voiceId: 'Puck'}])] as [SpeakerConfig, SpeakerConfig];
    speakers[idx] = { ...speakers[idx], ...updates };
    setCurrentProject(prev => ({ ...prev, speakers }));
  };

  return (
    <div className="flex-1 flex flex-col lg:grid lg:grid-cols-12 gap-8 overflow-hidden max-w-[1700px] mx-auto w-full animate-in fade-in zoom-in duration-500">
      
      {/* Control Sidebar */}
      <div className="lg:col-span-4 flex flex-col gap-6 overflow-hidden">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={() => setView('dashboard')} className="p-3 bg-gray-900 border border-white/5 rounded-2xl hover:bg-gray-800 transition-all shadow-xl"><ChevronLeft className="w-5 h-5" /></button>
            <h2 className="text-[10px] font-black uppercase tracking-[0.4em] text-gray-500">Render Controller</h2>
          </div>
        </div>

        <div className="bg-gray-900/40 p-1.5 rounded-3xl border border-white/5 flex shrink-0 backdrop-blur-xl shadow-inner">
          <button 
            onClick={() => setSidebarTab('visual')}
            className={`flex-1 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-3 transition-all ${sidebarTab === 'visual' ? 'bg-gray-800 text-indigo-400 shadow-2xl' : 'text-gray-500 hover:text-white'}`}
          >
            <Palette className="w-4 h-4" /> Visual
          </button>
          <button 
            onClick={() => setSidebarTab('audio')}
            className={`flex-1 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-3 transition-all ${sidebarTab === 'audio' ? 'bg-gray-800 text-indigo-400 shadow-2xl' : 'text-gray-500 hover:text-white'}`}
          >
            <Volume2 className="w-4 h-4" /> Sonic
          </button>
          <button 
            onClick={() => setSidebarTab('cloud')}
            className={`flex-1 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-3 transition-all ${sidebarTab === 'cloud' ? 'bg-gray-800 text-indigo-400 shadow-2xl' : 'text-gray-500 hover:text-white'}`}
          >
            <Cloud className="w-4 h-4" /> Cloud
          </button>
        </div>

        <div className="flex-1 overflow-y-auto custom-scroll pr-3 space-y-8 pb-32">
          {sidebarTab === 'visual' && (
            <div className="space-y-8 animate-in fade-in duration-300">
              <div className="space-y-4">
                 <div className="flex items-center justify-between px-1">
                   <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Narrative Script</label>
                   <button 
                      onClick={() => setGroundingEnabled(!groundingEnabled)}
                      className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border transition-all ${groundingEnabled ? 'bg-indigo-500/20 border-indigo-500 text-indigo-400' : 'bg-gray-900 border-white/5 text-gray-700'}`}
                   >
                      <Globe className="w-3.5 h-3.5" />
                      <span className="text-[9px] font-black uppercase">Search Grounding</span>
                   </button>
                 </div>
                 <textarea
                   value={project.prompt}
                   onChange={(e) => setCurrentProject(prev => ({ ...prev, prompt: e.target.value }))}
                   placeholder="Describe your scene in cinematic detail..."
                   className="w-full h-36 bg-gray-900/50 border border-white/10 rounded-3xl p-6 text-white placeholder-gray-800 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 resize-none transition-all text-xs font-medium leading-relaxed shadow-inner"
                 />
              </div>

              <div className="space-y-5">
                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest flex items-center gap-3">
                  <Layers className="w-4 h-4 text-indigo-500" /> Aesthetic Preset
                </label>
                <StyleGrid selectedId={project.style || 'cinematic'} onSelect={(id) => setCurrentProject(prev => ({ ...prev, style: id }))} />
              </div>

              <div className="space-y-5">
                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest flex items-center gap-3">
                  <Video className="w-4 h-4 text-indigo-500" /> Camera Dynamics
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {CAMERA_MOVEMENTS.map((cam) => (
                    <button
                      key={cam.id}
                      onClick={() => setCurrentProject(prev => ({ ...prev, cameraMovement: cam.id }))}
                      className={`p-3 rounded-xl border text-[9px] font-black uppercase tracking-wider transition-all ${project.cameraMovement === cam.id ? 'bg-indigo-500/20 border-indigo-500 text-indigo-400' : 'bg-gray-900 border-white/5 text-gray-500 hover:text-white'}`}
                    >
                      {cam.name}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-5">
                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest flex items-center gap-3">
                  <ImageIcon className="w-4 h-4 text-indigo-500" /> Image Seed Reference
                </label>
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className={`group relative h-48 border-2 border-dashed rounded-[2.5rem] transition-all cursor-pointer flex flex-col items-center justify-center overflow-hidden shadow-inner ${
                    uploadedImage ? 'border-indigo-500 bg-indigo-500/5 shadow-[0_0_30px_rgba(79,70,229,0.1)]' : 'border-white/5 hover:border-gray-700 bg-gray-900/30'
                  }`}
                >
                  {uploadedImage ? (
                    <img src={uploadedImage} alt="" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000" />
                  ) : (
                    <div className="flex flex-col items-center gap-4">
                      <div className="p-5 bg-gray-800 rounded-3xl group-hover:scale-110 transition-transform duration-500 shadow-2xl">
                        <ImageIcon className="w-6 h-6 text-indigo-400" />
                      </div>
                      <p className="text-[10px] text-gray-600 font-black uppercase tracking-[0.2em]">Upload Keyframe</p>
                    </div>
                  )}
                  <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onloadend = () => setUploadedImage(reader.result as string);
                      reader.readAsDataURL(file);
                    }
                  }} />
                </div>
              </div>
            </div>
          )}

          {sidebarTab === 'audio' && (
            <div className="space-y-8 animate-in fade-in duration-300">
               <div className="p-8 bg-indigo-500/5 border border-indigo-500/10 rounded-[2.5rem] space-y-8 shadow-inner">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-black text-indigo-400 uppercase tracking-[0.4em] flex items-center gap-4">
                      <Mic className="w-5 h-5" /> Sonic Layer Synthesis
                    </label>
                    <button 
                      onClick={() => setCurrentProject(prev => ({ ...prev, isMultiSpeaker: !prev.isMultiSpeaker }))}
                      className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border transition-all ${project.isMultiSpeaker ? 'bg-indigo-500 border-indigo-400 text-white' : 'bg-gray-900 border-white/5 text-gray-600'}`}
                    >
                      <Users className="w-3.5 h-3.5" />
                      <span className="text-[8px] font-black uppercase">Dialogue Mode</span>
                    </button>
                  </div>

                  <textarea
                    value={project.audioPrompt}
                    onChange={(e) => setCurrentProject(prev => ({ ...prev, audioPrompt: e.target.value }))}
                    placeholder={project.isMultiSpeaker ? "Joe: Hello Jane!\nJane: Hi Joe, ready for the scene?" : "Enter narration script..."}
                    className="w-full h-40 bg-gray-950/50 border border-white/5 rounded-3xl p-6 text-white placeholder-gray-800 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 resize-none transition-all text-xs shadow-inner"
                  />

                  {project.isMultiSpeaker ? (
                    <div className="grid grid-cols-2 gap-4">
                      {[0, 1].map(idx => (
                        <div key={idx} className="space-y-3">
                           <input 
                              type="text" 
                              value={project.speakers?.[idx]?.name || (idx === 0 ? 'Joe' : 'Jane')}
                              onChange={(e) => updateSpeaker(idx, { name: e.target.value })}
                              className="w-full bg-gray-900 border border-white/5 rounded-xl px-3 py-2 text-[10px] font-black uppercase text-indigo-300"
                              placeholder={`Speaker ${idx + 1}`}
                           />
                           <select 
                              value={project.speakers?.[idx]?.voiceId || (idx === 0 ? 'Kore' : 'Puck')}
                              onChange={(e) => updateSpeaker(idx, { voiceId: e.target.value })}
                              className="w-full bg-gray-900 border border-white/5 rounded-xl px-3 py-2 text-[9px] font-bold text-gray-400 focus:outline-none"
                           >
                              {VOICES.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
                           </select>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 gap-3">
                      {VOICES.map(v => (
                        <button
                          key={v.id}
                          onClick={() => setCurrentProject(prev => ({ ...prev, selectedVoice: v.id }))}
                          className={`p-4 rounded-2xl border text-left flex justify-between items-center transition-all ${project.selectedVoice === v.id ? 'bg-indigo-600 border-indigo-400 text-white shadow-2xl' : 'bg-gray-900/50 border-white/5 text-gray-500 hover:bg-gray-800'}`}
                        >
                          <div className="flex flex-col">
                            <span className="text-[11px] font-black uppercase tracking-widest">{v.name}</span>
                            <span className="text-[8px] font-bold opacity-50 uppercase">{v.desc}</span>
                          </div>
                          <Volume2 className={`w-5 h-5 ${project.selectedVoice === v.id ? 'opacity-100' : 'opacity-20'}`} />
                        </button>
                      ))}
                    </div>
                  )}

                  <button
                    disabled={!project.audioPrompt || isSynthesizingAudio}
                    onClick={handleSynthesizeAudio}
                    className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-3 transition-all active:scale-95 disabled:opacity-50"
                  >
                    {isSynthesizingAudio ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
                    Synthesize Sonic Layer
                  </button>
               </div>
            </div>
          )}

          {sidebarTab === 'cloud' && (
            <CloudConsole />
          )}
        </div>

        <div className="shrink-0 pt-6 border-t border-white/5 mt-auto">
          {project.clips?.length ? (
            <button
              disabled={project.status === 'generating'}
              onClick={extendTimeline}
              className="w-full py-6 bg-indigo-600 hover:bg-indigo-500 text-white rounded-[1.5rem] font-black text-[11px] uppercase tracking-[0.4em] flex items-center justify-center gap-4 transition-all active:scale-95 shadow-2xl shadow-indigo-600/30 disabled:opacity-50"
            >
              {project.status === 'generating' ? <Loader2 className="w-5 h-5 animate-spin" /> : <FastForward className="w-5 h-5" />}
              Extend Timeline (+7s)
            </button>
          ) : (
            <button
              disabled={!project.prompt || project.status === 'generating'}
              onClick={startInitialGeneration}
              className={`w-full py-6 rounded-[1.5rem] font-black text-[11px] uppercase tracking-[0.4em] flex items-center justify-center gap-4 transition-all active:scale-95 shadow-2xl ${project.status === 'generating' ? 'bg-gray-800 text-gray-600' : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-600/30'}`}
            >
              {project.status === 'generating' ? <Loader2 className="w-5 h-5 animate-spin" /> : <Terminal className="w-5 h-5" />}
              Initiate Render Protocol
            </button>
          )}
          {error && <p className="mt-4 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-500 text-[10px] font-black uppercase tracking-widest flex items-center gap-3"><Info className="w-4 h-4" /> {error}</p>}
        </div>
      </div>

      {/* Preview Section */}
      <div className="lg:col-span-8 flex flex-col gap-8 overflow-hidden h-full">
        <div className="flex-1 bg-black border border-white/10 rounded-[4rem] overflow-hidden relative shadow-[0_0_100px_rgba(0,0,0,0.5)] flex flex-col group/preview">
          
          {/* Generation Overlay */}
          {(project.status === 'generating' || isSynthesizingAudio) && (
            <div className="absolute inset-0 z-[50] bg-gray-950/98 backdrop-blur-[100px] flex flex-col items-center justify-center p-12 text-center gap-12">
              <div className="relative">
                <div className="w-48 h-48 border-8 border-indigo-500/5 border-t-indigo-500 rounded-full animate-[spin_2s_linear_infinite]"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <Activity className="w-12 h-12 text-indigo-400 animate-pulse" />
                </div>
              </div>
              <div className="space-y-8 w-full max-w-xl">
                <div className="space-y-2">
                  <h3 className="text-2xl font-black tracking-[0.4em] uppercase text-white">
                    {isSynthesizingAudio ? "Synthesizing Sonic Flux" : "Processing Cinematic Stream"}
                  </h3>
                  <p className="text-[10px] font-mono text-indigo-500/60 uppercase tracking-[0.5em]">
                    {isSynthesizingAudio ? "DECODING_VOICE_LATENTS" : "Allocating High-Bandwidth Latents"}
                  </p>
                </div>
                <TerminalLog messages={logMessages} />
              </div>
            </div>
          )}

          <div className="flex-1 relative flex items-center justify-center bg-gray-950 shadow-inner">
             {activeClip ? (
               <div className="w-full h-full relative group/player">
                 <video 
                  key={activeClip.id}
                  ref={mainVideoRef} 
                  src={activeClip.url} 
                  className="w-full h-full object-contain" 
                  controls 
                  autoPlay 
                  loop 
                 />
                 
                 {/* Grounding Info Layer */}
                 {project.groundingSources && project.groundingSources.length > 0 && (
                   <div className="absolute top-10 right-10 max-w-sm p-6 bg-black/70 backdrop-blur-3xl border border-white/5 rounded-[2rem] opacity-0 group-hover/player:opacity-100 transition-all duration-500 translate-x-4 group-hover/player:translate-x-0 shadow-2xl">
                      <div className="flex items-center gap-3 mb-4 text-indigo-400">
                         <Globe className="w-4 h-4" />
                         <span className="text-[9px] font-black uppercase tracking-[0.2em]">Validated References</span>
                      </div>
                      <div className="space-y-3 max-h-48 overflow-y-auto custom-scroll pr-3">
                         {project.groundingSources.map((s, idx) => (
                           <a key={idx} href={s.uri} target="_blank" rel="noreferrer" className="block p-3 bg-white/5 rounded-2xl hover:bg-indigo-500/10 border border-white/5 transition-all">
                             <p className="text-[8px] font-black uppercase text-gray-300 line-clamp-1">{s.title}</p>
                             <div className="flex items-center gap-1 mt-1.5 text-[7px] text-indigo-500 font-mono truncate opacity-60">Source: {s.uri}</div>
                           </a>
                         ))}
                      </div>
                   </div>
                 )}

                 {/* Metadata Badge */}
                 <div className="absolute bottom-10 left-10 flex flex-col gap-3">
                    <div className="bg-black/60 backdrop-blur-3xl px-6 py-3 rounded-[1.5rem] border border-white/10 shadow-2xl opacity-0 group-hover/player:opacity-100 transition-all duration-500 translate-y-4 group-hover/player:translate-y-0">
                       <div className="text-indigo-400 text-[8px] font-black uppercase tracking-[0.3em] mb-2">Sequence Output</div>
                       <div className="flex items-center gap-6 text-[10px] font-bold text-white/90">
                          <span className="flex items-center gap-2"><Activity className="w-3.5 h-3.5 opacity-40" /> {project.resolution}</span>
                          <span className="w-1.5 h-1.5 rounded-full bg-indigo-500/30"></span>
                          <span className="flex items-center gap-2"><Clock className="w-3.5 h-3.5 opacity-40" /> {totalDuration}S Sequence</span>
                       </div>
                    </div>
                 </div>
               </div>
             ) : (
               <div className="text-center space-y-8 p-12 animate-pulse">
                  <div className="w-28 h-28 bg-gray-900/50 border border-white/5 rounded-[3rem] flex items-center justify-center mx-auto shadow-inner">
                    <Play className="w-10 h-10 text-gray-800" />
                  </div>
                  <div className="space-y-2">
                    <p className="text-[10px] font-black text-gray-700 uppercase tracking-[0.6em]">System Idle</p>
                    <p className="text-[8px] font-mono text-gray-800">WAITING_FOR_INITIAL_RENDER</p>
                  </div>
               </div>
             )}
          </div>

          {/* Timeline Controller */}
          <div className="bg-gray-950 p-8 flex items-center justify-between border-t border-white/5 backdrop-blur-3xl">
             <div className="flex items-center gap-6 overflow-x-auto pb-4 custom-scroll max-w-[65%] group/timeline">
                {project.clips?.map((clip, idx) => (
                  <div key={clip.id} className="flex flex-col gap-3 shrink-0 group/clip">
                     <div 
                        onClick={() => {
                          if (mainVideoRef.current) {
                            mainVideoRef.current.src = clip.url;
                            mainVideoRef.current.play();
                          }
                        }}
                        className={`w-40 aspect-video bg-black rounded-2xl overflow-hidden border transition-all cursor-pointer relative shadow-2xl ${activeClip?.id === clip.id ? 'border-indigo-500 scale-105' : 'border-white/10 group-hover/clip:border-indigo-500/50'}`}
                      >
                        <video src={clip.url} className="w-full h-full object-cover opacity-40 group-hover/clip:opacity-80 transition-opacity" />
                        <div className="absolute inset-0 flex items-center justify-center text-[12px] font-black text-white/20 group-hover/clip:text-indigo-400 transition-all scale-150 group-hover/clip:scale-100">CH_{idx + 1}</div>
                        <div className="absolute bottom-2 right-2 bg-black/60 px-1.5 py-0.5 rounded text-[7px] font-black text-white/60">{clip.duration}s</div>
                     </div>
                  </div>
                ))}
                {project.status === 'completed' && (
                  <button 
                    onClick={extendTimeline} 
                    className="w-40 aspect-video bg-gray-900/30 border-2 border-dashed border-white/5 rounded-2xl flex flex-col items-center justify-center gap-3 hover:bg-indigo-500/5 hover:border-indigo-500/20 transition-all shrink-0 group/add"
                  >
                     <Plus className="w-6 h-6 text-gray-700 group-hover/add:text-indigo-500 transition-colors" />
                     <span className="text-[9px] font-black text-gray-700 uppercase tracking-widest group-hover/add:text-indigo-400">Expand Sequence</span>
                  </button>
                )}
             </div>

             <div className="flex items-center gap-6">
                {project.audioUrl && (
                  <div className="flex items-center gap-4 bg-indigo-500/5 px-6 py-3 rounded-2xl border border-indigo-500/10 shadow-inner">
                     <Volume2 className="w-5 h-5 text-indigo-400" />
                     <audio src={project.audioUrl} controls className="h-6 w-36 filter invert brightness-200 contrast-125 opacity-70" />
                  </div>
                )}
                {activeClip && (
                  <div className="flex gap-3">
                    <button 
                      onClick={() => {
                        const a = document.createElement('a');
                        a.href = activeClip.url;
                        a.download = `kaleidoscope_prod_${project.id}.mp4`;
                        a.click();
                      }}
                      className="bg-white text-black px-10 py-4 rounded-2xl font-black uppercase text-[11px] tracking-[0.2em] hover:bg-indigo-500 hover:text-white transition-all shadow-2xl shadow-indigo-600/20 active:scale-95 flex items-center gap-3"
                    >
                      <Download className="w-4 h-4" /> Export Media
                    </button>
                  </div>
                )}
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Editor;
