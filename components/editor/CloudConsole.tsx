
import React, { useState } from 'react';
import { Folder, FileCode, ChevronRight, ChevronDown, Terminal, Server, Shield, Database, Bell, CreditCard, Cpu } from 'lucide-react';

interface FileNode {
  name: string;
  type: 'folder' | 'file';
  children?: FileNode[];
  icon?: any;
}

const BACKEND_STRUCTURE: FileNode = {
  name: "backend",
  type: "folder",
  icon: Server,
  children: [
    {
      name: "api-gateway",
      type: "folder",
      icon: Terminal,
      children: [
        {
          name: "src",
          type: "folder",
          children: [
            {
              name: "middleware",
              type: "folder",
              children: [
                { name: "auth.ts", type: "file" },
                { name: "rateLimit.ts", type: "file" },
                { name: "validation.ts", type: "file" }
              ]
            },
            {
              name: "routes",
              type: "folder",
              children: [
                {
                  name: "v1",
                  type: "folder",
                  children: [
                    { name: "projects.ts", type: "file" },
                    { name: "generations.ts", type: "file" },
                    { name: "billing.ts", type: "file" }
                  ]
                },
                { name: "health.ts", type: "file" }
              ]
            },
            {
              name: "config",
              type: "folder",
              children: [
                { name: "gateway.config.ts", type: "file" },
                { name: "services.config.ts", type: "file" }
              ]
            }
          ]
        },
        { name: "Dockerfile", type: "file" },
        { name: "package.json", type: "file" }
      ]
    },
    {
      name: "auth-service",
      type: "folder",
      icon: Shield,
      children: [
        {
          name: "src",
          type: "folder",
          children: [
            { name: "controllers", type: "folder", children: [{ name: "auth.controller.ts", type: "file" }] },
            { name: "services", type: "folder", children: [{ name: "auth.service.ts", type: "file" }] },
            { name: "models", type: "folder", children: [{ name: "User.ts", type: "file" }] }
          ]
        },
        { name: "prisma/schema.prisma", type: "file" }
      ]
    },
    {
      name: "generation-service",
      type: "folder",
      icon: Cpu,
      children: [
        {
          name: "src",
          type: "folder",
          children: [
            { name: "workers", type: "folder", children: [{ name: "video.worker.ts", type: "file" }, { name: "audio.worker.ts", type: "file" }] },
            { name: "queues", type: "folder", children: [{ name: "generation.queue.ts", type: "file" }] }
          ]
        },
        { name: "Dockerfile.gpu", type: "file" }
      ]
    },
    {
      name: "media-service",
      type: "folder",
      icon: Database,
      children: [
        { name: "src/processors", type: "folder", children: [{ name: "video.processor.go", type: "file" }] },
        { name: "src/storage", type: "folder", children: [{ name: "s3.client.go", type: "file" }] }
      ]
    },
    {
      name: "notification-service",
      type: "folder",
      icon: Bell,
      children: [
        { name: "src/notifiers", type: "folder", children: [{ name: "websocket.notifier.ts", type: "file" }] }
      ]
    },
    {
      name: "billing-service",
      type: "folder",
      icon: CreditCard,
      children: [
        { name: "src/services", type: "folder", children: [{ name: "stripe.service.ts", type: "file" }] }
      ]
    }
  ]
};

const TreeNode: React.FC<{ node: FileNode; depth: number }> = ({ node, depth }) => {
  const [isOpen, setIsOpen] = useState(depth === 0 || depth === 1);
  const Icon = node.icon || (node.type === 'folder' ? Folder : FileCode);

  return (
    <div className="select-none">
      <div 
        onClick={() => node.type === 'folder' && setIsOpen(!isOpen)}
        className={`flex items-center gap-2 py-1.5 px-2 rounded-lg cursor-pointer transition-colors group ${
          node.type === 'folder' ? 'hover:bg-white/5' : 'hover:bg-indigo-500/5'
        }`}
        style={{ paddingLeft: `${depth * 12 + 8}px` }}
      >
        <span className="w-4 h-4 flex items-center justify-center">
          {node.type === 'folder' && (
            isOpen ? <ChevronDown className="w-3 h-3 text-gray-600" /> : <ChevronRight className="w-3 h-3 text-gray-600" />
          )}
        </span>
        <Icon className={`w-3.5 h-3.5 ${node.type === 'folder' ? 'text-indigo-400/60' : 'text-gray-500'} group-hover:text-indigo-400 transition-colors`} />
        <span className={`text-[10px] font-mono tracking-tight ${
          node.type === 'folder' ? 'text-gray-300 font-bold' : 'text-gray-500'
        } group-hover:text-white transition-colors`}>
          {node.name}
        </span>
      </div>
      {node.type === 'folder' && isOpen && node.children && (
        <div className="border-l border-white/5 ml-[15px]">
          {node.children.map((child, i) => (
            <TreeNode key={i} node={child} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  );
};

const CloudConsole: React.FC = () => {
  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
      <div className="p-6 bg-gray-950/50 border border-white/5 rounded-3xl space-y-6 shadow-inner">
        <div className="flex items-center justify-between">
          <div className="flex flex-col">
            <h3 className="text-[11px] font-black text-white uppercase tracking-[0.4em]">Backend Infrastructure</h3>
            <span className="text-[8px] font-mono text-indigo-500/60 uppercase">Cluster: KALEIDOSCOPE_PROD_01</span>
          </div>
          <div className="flex gap-1">
            <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></div>
            <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse delay-75"></div>
            <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse delay-150"></div>
          </div>
        </div>

        <div className="bg-black/40 border border-white/5 rounded-2xl p-4 overflow-hidden shadow-inner max-h-[500px] overflow-y-auto custom-scroll">
          <TreeNode node={BACKEND_STRUCTURE} depth={0} />
        </div>

        <div className="p-4 bg-indigo-500/5 border border-indigo-500/10 rounded-2xl space-y-3">
          <div className="flex items-center gap-2 text-indigo-400">
            <Terminal className="w-3.5 h-3.5" />
            <span className="text-[9px] font-black uppercase tracking-widest">System Status</span>
          </div>
          <div className="grid grid-cols-2 gap-4">
             <div className="space-y-1">
                <span className="text-[7px] text-gray-600 uppercase font-black">Memory Load</span>
                <div className="h-1 bg-gray-900 rounded-full overflow-hidden">
                   <div className="h-full bg-indigo-500 w-[42%]"></div>
                </div>
             </div>
             <div className="space-y-1">
                <span className="text-[7px] text-gray-600 uppercase font-black">GPU Temp</span>
                <div className="h-1 bg-gray-900 rounded-full overflow-hidden">
                   <div className="h-full bg-orange-500 w-[68%]"></div>
                </div>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CloudConsole;
