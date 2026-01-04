
import React, { useRef, useEffect } from 'react';

interface TerminalLogProps {
  messages: string[];
}

const TerminalLog: React.FC<TerminalLogProps> = ({ messages }) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  return (
    <div 
      ref={scrollRef} 
      className="w-full h-36 bg-black/90 rounded-2xl border border-white/10 p-4 overflow-y-auto font-mono text-[9px] text-indigo-400/90 space-y-1.5 custom-scroll shadow-inner backdrop-blur-xl"
    >
      <div className="flex gap-2 opacity-30 border-b border-white/5 pb-1 mb-2">
        <span className="uppercase tracking-widest text-[7px] font-black">System Output Stream</span>
      </div>
      {messages.length === 0 && (
        <div className="animate-pulse flex gap-2">
          <span className="opacity-20 text-gray-500">[{new Date().toLocaleTimeString([], { hour12: false })}]</span>
          <span>LISTENING_FOR_EVENTS...</span>
        </div>
      )}
      {messages.map((m, i) => (
        <div key={i} className="flex gap-2 animate-in slide-in-from-left-2 duration-300">
          <span className="opacity-20 text-gray-500 font-bold">[{new Date().toLocaleTimeString([], { hour12: false })}]</span>
          <span className={i === messages.length - 1 ? "text-indigo-300 font-bold" : "opacity-80"}>
            <span className="mr-2 text-indigo-600/50">#</span>
            {m}
          </span>
        </div>
      ))}
    </div>
  );
};

export default TerminalLog;
