
import React from 'react';
import { STYLE_PRESETS } from '../constants';
import { CheckCircle2, Info } from 'lucide-react';

interface StyleGridProps {
  selectedId: string;
  onSelect: (id: string) => void;
}

const StyleGrid: React.FC<StyleGridProps> = ({ selectedId, onSelect }) => {
  return (
    <div className="grid grid-cols-2 gap-2.5">
      {STYLE_PRESETS.map((style) => (
        <button
          key={style.id}
          onClick={() => onSelect(style.id)}
          className={`relative group rounded-xl overflow-hidden border-2 transition-all h-24 ${
            selectedId === style.id 
              ? 'border-indigo-500 ring-2 ring-indigo-500/20' 
              : 'border-gray-800 hover:border-gray-600 bg-gray-900'
          }`}
          title={style.description}
        >
          <img 
            src={style.thumbnail} 
            alt={style.name} 
            className={`w-full h-full object-cover transition-transform duration-700 ${
              selectedId === style.id ? 'scale-110 blur-[1px]' : 'group-hover:scale-110'
            }`}
          />
          
          {/* Overlay */}
          <div className={`absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent flex flex-col justify-end p-2 transition-opacity ${
            selectedId === style.id ? 'opacity-100' : 'opacity-70 group-hover:opacity-100'
          }`}>
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black text-white uppercase tracking-wider truncate mr-1">
                {style.name}
              </span>
              <Info className="w-3 h-3 text-white/30 group-hover:text-white/60" />
            </div>
          </div>

          {/* Selection Indicator */}
          {selectedId === style.id && (
            <div className="absolute top-1.5 right-1.5 animate-in zoom-in duration-300">
              <div className="bg-indigo-500 rounded-full p-0.5 shadow-lg shadow-black/50">
                <CheckCircle2 className="w-3.5 h-3.5 text-white" />
              </div>
            </div>
          )}

          {/* Pulse effect for selected */}
          {selectedId === style.id && (
            <div className="absolute inset-0 ring-inset ring-2 ring-indigo-500/50 animate-pulse pointer-events-none" />
          )}
        </button>
      ))}
    </div>
  );
};

export default StyleGrid;
