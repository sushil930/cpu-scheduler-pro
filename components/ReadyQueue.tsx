import React from 'react';
import { Process } from '../types';
import { ArrowRight, Cpu, Layers, Zap } from 'lucide-react';

interface ReadyQueueProps {
  queueIds: string[];
  processes: Process[];
  cpuId: string | null;
}

const ReadyQueue: React.FC<ReadyQueueProps> = ({ queueIds, processes, cpuId }) => {
  const runningProcess = cpuId ? processes.find(p => p.id === cpuId) : null;

  return (
    <div className="w-full bg-white/60 dark:bg-slate-900/60 backdrop-blur-md rounded-2xl border border-slate-200 dark:border-white/5 shadow-xl p-4 flex flex-col gap-4 relative overflow-hidden shrink-0 transition-colors duration-300">
      {/* Decorative background elements */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 blur-2xl rounded-full -mr-10 -mt-10 pointer-events-none"></div>

      {/* Label */}
      <div className="flex items-center justify-between z-10">
        <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest flex items-center gap-2">
            <Layers size={14} /> Execution Pipeline
        </h3>
      </div>

      <div className="flex items-center gap-4 z-10 w-full">
        
        {/* 1. READY QUEUE VISUALS (Source) */}
        <div className="flex-1 bg-slate-50 dark:bg-slate-950/50 rounded-xl border border-slate-200 dark:border-slate-800/50 p-2 min-w-0 relative h-24 flex items-center order-1 transition-colors duration-300">
             <span className="absolute -top-2 left-3 bg-white dark:bg-slate-900 px-1.5 text-[9px] font-bold text-slate-500 dark:text-slate-500 border border-slate-200 dark:border-slate-800 rounded transition-colors duration-300">
                 READY QUEUE
             </span>
             
             <div className="flex items-center gap-2 overflow-x-auto p-1 scrollbar-thin scrollbar-thumb-slate-300 dark:scrollbar-thumb-slate-700 scrollbar-track-transparent w-full h-full">
                {queueIds.length === 0 ? (
                    <div className="w-full flex items-center justify-center opacity-30">
                        <span className="text-[10px] font-mono text-slate-400 dark:text-slate-500 uppercase">Empty</span>
                    </div>
                ) : (
                    queueIds.map((id, idx) => {
                        const process = processes.find(p => p.id === id);
                        if (!process) return null;
                        const progress = (process.remainingTime / process.burstTime) * 100;
                        
                        return (
                            <div key={`${id}-${idx}`} className="relative group flex-shrink-0">
                                <div 
                                    className="w-12 h-14 rounded-md bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 flex flex-col items-center justify-between py-1.5 shadow-lg group-hover:-translate-y-1 transition-transform overflow-hidden"
                                    style={{ borderColor: process.color }}
                                >
                                    <div className="w-full h-1 absolute top-0 bg-black/5 dark:bg-white/10"></div>
                                    
                                    <span className="font-bold text-slate-900 dark:text-white text-xs drop-shadow-sm z-10">{id}</span>
                                    
                                    <div className="flex flex-col items-center w-full px-1 gap-0.5">
                                        <span className="text-[8px] font-mono text-slate-500 dark:text-slate-300 leading-none">
                                            {process.remainingTime}ms
                                        </span>
                                        <div className="w-full h-1 bg-slate-100 dark:bg-slate-900 rounded-full overflow-hidden">
                                            <div 
                                                className="h-full bg-slate-400 dark:bg-white/50" 
                                                style={{ width: `${progress}%` }}
                                            ></div>
                                        </div>
                                    </div>
                                </div>
                                {/* Connector line for list */}
                                {idx < queueIds.length - 1 && (
                                    <div className="absolute top-1/2 -right-2 w-2 h-[1px] bg-slate-300 dark:bg-slate-700"></div>
                                )}
                            </div>
                        );
                    })
                )}
             </div>
        </div>

        {/* 2. CONNECTOR (Flow) */}
        <div className="flex flex-col items-center justify-center gap-1 text-slate-400 dark:text-slate-700 shrink-0 order-2 transition-colors duration-300">
             <div className="w-6 h-[2px] bg-slate-300 dark:bg-slate-800 relative overflow-hidden">
                {runningProcess && <div className="absolute inset-0 bg-blue-500/50 w-1/2 animate-[slideRight_1s_infinite_linear]"></div>}
             </div>
             <ArrowRight size={12} />
             <div className="w-6 h-[2px] bg-slate-300 dark:bg-slate-800 relative overflow-hidden">
                {runningProcess && <div className="absolute inset-0 bg-blue-500/50 w-1/2 animate-[slideRight_1s_infinite_linear] delay-75"></div>}
             </div>
        </div>

        {/* 3. CPU CORE VISUALIZATION (Destination / Highlight) */}
        <div className="relative group shrink-0 order-3">
            {/* Dynamic Glow Effect */}
            <div 
                className="absolute inset-0 blur-2xl rounded-full transition-opacity duration-500"
                style={{ 
                    backgroundColor: runningProcess ? runningProcess.color : '#10b981',
                    opacity: runningProcess ? 0.2 : 0 
                }}
            ></div>
            
            {/* Chip Container */}
            <div 
                className={`w-24 h-24 rounded-xl border-2 flex flex-col items-center justify-center relative bg-white dark:bg-slate-950 shadow-2xl transition-all duration-300 ${
                    !runningProcess && 'border-slate-200 dark:border-slate-700 shadow-inner'
                }`}
                style={runningProcess ? {
                    borderColor: runningProcess.color,
                    boxShadow: `0 0 30px -5px ${runningProcess.color}40`
                } : {}}
            >
                {/* Chip Pins */}
                <div className="absolute -left-1 top-4 w-1 h-1 bg-slate-300 dark:bg-slate-600 rounded-full"></div>
                <div className="absolute -left-1 top-9 w-1 h-1 bg-slate-300 dark:bg-slate-600 rounded-full"></div>
                <div className="absolute -left-1 top-14 w-1 h-1 bg-slate-300 dark:bg-slate-600 rounded-full"></div>
                <div className="absolute -right-1 top-4 w-1 h-1 bg-slate-300 dark:bg-slate-600 rounded-full"></div>
                <div className="absolute -right-1 top-9 w-1 h-1 bg-slate-300 dark:bg-slate-600 rounded-full"></div>
                <div className="absolute -right-1 top-14 w-1 h-1 bg-slate-300 dark:bg-slate-600 rounded-full"></div>
                
                {/* Label */}
                <div className="absolute top-1.5 left-2 text-[7px] font-mono text-slate-400 dark:text-slate-500">CPU_0</div>
                
                {runningProcess ? (
                    <>
                        <span 
                            className="text-3xl font-black text-slate-900 dark:text-white drop-shadow-md mb-1 z-10 tracking-tight" 
                            style={{color: runningProcess.color}}
                        >
                            {runningProcess.id}
                        </span>
                        
                        {/* Process Progress Bar */}
                        <div className="w-16 h-1.5 bg-slate-100 dark:bg-slate-900 rounded-full overflow-hidden border border-black/5 dark:border-white/5">
                            <div 
                                className="h-full transition-all duration-300"
                                style={{ 
                                    width: `${(runningProcess.remainingTime / runningProcess.burstTime) * 100}%`,
                                    backgroundColor: runningProcess.color
                                }}
                            />
                        </div>
                        
                        <span className="text-[9px] font-mono font-bold mt-1" style={{color: runningProcess.color}}>
                            {runningProcess.remainingTime}ms
                        </span>

                        {/* Active Pulse Icon */}
                        <Zap size={12} className="absolute top-2 right-2 animate-pulse" style={{ color: runningProcess.color }} fill="currentColor" />
                    </>
                ) : (
                    <div className="flex flex-col items-center opacity-50">
                        <Cpu size={24} className="text-slate-400 dark:text-slate-600 mb-1" />
                        <span className="text-[9px] font-bold text-slate-400 dark:text-slate-600 uppercase tracking-wider">Idle</span>
                    </div>
                )}
            </div>
            
            {/* Status Badge */}
            <div className="text-center mt-2">
                 <span 
                    className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded border transition-all shadow-sm ${!runningProcess ? 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 border-slate-200 dark:border-slate-700' : ''}`}
                    style={runningProcess ? {
                        backgroundColor: `${runningProcess.color}20`, 
                        color: runningProcess.color,
                        borderColor: `${runningProcess.color}40`
                    } : {}}
                 >
                    {runningProcess ? 'EXECUTING' : 'WAITING'}
                 </span>
            </div>
        </div>

      </div>
      
      <style>{`
        @keyframes slideRight {
            from { transform: translateX(-100%); }
            to { transform: translateX(200%); }
        }
      `}</style>
    </div>
  );
};

export default ReadyQueue;