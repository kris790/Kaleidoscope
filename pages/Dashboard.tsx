
import React from 'react';
import { Plus, Video, Play, Trash2, Clock, RefreshCcw, ArrowRight } from 'lucide-react';
import { Project } from '../types';

interface DashboardProps {
  projects: Project[];
  onOpenProject: (p: Project) => void;
  onDeleteProject: (id: string) => void;
  onCreateNew: () => void;
}

const Dashboard: React.FC<DashboardProps> = ({ projects, onOpenProject, onDeleteProject, onCreateNew }) => {
  return (
    <div className="max-w-7xl mx-auto w-full space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-1">
          <h1 className="text-4xl font-black tracking-tighter uppercase text-white">Your Production Archive</h1>
          <p className="text-gray-500 text-sm font-medium">Synthesize high-fidelity cinematic experiences.</p>
        </div>
        <button 
          onClick={onCreateNew}
          className="bg-indigo-600 hover:bg-indigo-500 text-white font-black uppercase tracking-widest text-[10px] px-8 py-4 rounded-2xl flex items-center gap-3 transition-all active:scale-95 shadow-2xl shadow-indigo-600/30 border border-indigo-400/20"
        >
          <Plus className="w-4 h-4" /> Start New Sequence
        </button>
      </div>

      {projects.length === 0 ? (
        <div className="h-[60vh] flex flex-col items-center justify-center bg-gray-900/10 border border-dashed border-white/5 rounded-[4rem] p-12 text-center gap-8 group">
          <div className="w-24 h-24 bg-gray-900 rounded-[2.5rem] flex items-center justify-center border border-white/5 group-hover:border-indigo-500/20 transition-all duration-500 shadow-inner">
            <Video className="w-10 h-10 text-gray-700 group-hover:text-indigo-500/40 transition-colors" />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-black uppercase tracking-tight text-white/90">Archive Terminal Empty</h2>
            <p className="text-gray-500 max-w-sm mx-auto text-sm font-medium leading-relaxed">
              Begin your visual journey by initiating a new high-fidelity render. Gemini Veo 3.1 is ready.
            </p>
          </div>
          <button onClick={onCreateNew} className="text-indigo-400 font-black uppercase tracking-widest text-xs flex items-center gap-3 hover:text-indigo-300 transition-colors bg-indigo-500/5 px-8 py-3 rounded-full border border-indigo-500/10">
            ENTER STUDIO <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 pb-20">
          {projects.map(project => (
            <div key={project.id} className="bg-gray-900/40 border border-white/5 rounded-[2.5rem] overflow-hidden group hover:border-indigo-500/30 transition-all flex flex-col shadow-2xl backdrop-blur-sm">
              <div className="relative aspect-video bg-black overflow-hidden">
                {project.clips.length > 0 ? (
                  <video 
                    src={project.clips[0].url} 
                    className="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-opacity duration-700" 
                    muted loop onMouseOver={(e) => e.currentTarget.play()} 
                    onMouseOut={(e) => { e.currentTarget.pause(); e.currentTarget.currentTime = 0; }} 
                  />
                ) : (
                  <img src={project.thumbnailUrl} className="w-full h-full object-cover opacity-30" alt="" />
                )}
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-500 bg-black/60 backdrop-blur-[4px]">
                  <button 
                    onClick={() => onOpenProject(project)}
                    className="bg-white text-black p-5 rounded-full shadow-2xl hover:scale-110 active:scale-90 transition-all"
                  >
                    <Play className="w-6 h-6 fill-current ml-0.5" />
                  </button>
                </div>
                <div className="absolute top-5 left-5 flex gap-2">
                  <div className="bg-black/80 backdrop-blur-xl px-2.5 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest border border-white/10 shadow-2xl">
                    {project.clips.length} CHPT
                  </div>
                </div>
              </div>
              <div className="p-6 flex-1 flex flex-col">
                <div className="space-y-2 mb-6">
                  <h3 className="text-xs font-black uppercase tracking-tight text-white group-hover:text-indigo-400 transition-colors line-clamp-1">{project.title}</h3>
                  <p className="text-[10px] font-medium text-gray-500 line-clamp-2 leading-relaxed italic">"{project.prompt}"</p>
                </div>
                <div className="flex items-center justify-between mt-auto pt-4 border-t border-white/5">
                  <span className="text-[8px] font-black text-gray-600 uppercase tracking-widest flex items-center gap-2">
                    <Clock className="w-3.5 h-3.5" /> {new Date(project.createdAt).toLocaleDateString()}
                  </span>
                  <div className="flex gap-1">
                    <button onClick={() => onOpenProject(project)} className="text-gray-600 hover:text-indigo-400 transition-colors p-2.5 rounded-xl hover:bg-white/5"><RefreshCcw className="w-4 h-4" /></button>
                    <button onClick={() => onDeleteProject(project.id)} className="text-gray-800 hover:text-red-500 transition-colors p-2.5 rounded-xl hover:bg-white/5"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Dashboard;
