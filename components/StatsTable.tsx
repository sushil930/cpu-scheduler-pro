import React from 'react';
import { Process, ProcessState } from '../types';
import { Activity, Clock, CheckCircle2, Download } from 'lucide-react';

interface StatsTableProps {
  processes: Process[];
  onDownload?: () => void;
}

const StatsTable: React.FC<StatsTableProps> = ({ processes, onDownload }) => {
  const completed = processes.filter(p => p.state === ProcessState.COMPLETED);
  const isFinished = processes.length > 0 && completed.length === processes.length;
  
  const avgTurnaround = completed.length 
    ? (completed.reduce((acc, p) => acc + p.turnaroundTime, 0) / completed.length).toFixed(2)
    : '-';
  const avgWaiting = completed.length
    ? (completed.reduce((acc, p) => acc + p.waitingTime, 0) / completed.length).toFixed(2)
    : '-';

  return (
    <div className="w-full h-full bg-white/60 dark:bg-slate-900/60 backdrop-blur-md rounded-2xl border border-slate-200 dark:border-white/5 shadow-xl overflow-hidden flex flex-col min-h-0 transition-colors duration-300">
      {/* Header Stats */}
      <div className="flex-shrink-0 px-6 py-3 border-b border-slate-200 dark:border-white/5 flex flex-wrap justify-between items-center bg-slate-50 dark:bg-slate-900/50 gap-4 transition-colors duration-300">
        <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest flex items-center gap-2">
            <Activity size={14} /> Performance Metrics
        </h3>
        <div className="flex items-center gap-4">
            <div className="flex gap-4">
                <div className="flex items-center gap-2 px-3 py-1 bg-white dark:bg-slate-950 rounded-lg border border-slate-200 dark:border-slate-800 transition-colors duration-300">
                    <Clock size={12} className="text-emerald-600 dark:text-emerald-400" />
                    <div className="flex flex-col leading-none">
                        <span className="text-[9px] text-slate-500 dark:text-slate-500 font-bold uppercase">Avg TAT</span>
                        <span className="text-sm font-mono font-bold text-emerald-600 dark:text-emerald-400">{avgTurnaround}</span>
                    </div>
                </div>
                <div className="flex items-center gap-2 px-3 py-1 bg-white dark:bg-slate-950 rounded-lg border border-slate-200 dark:border-slate-800 transition-colors duration-300">
                    <Clock size={12} className="text-amber-600 dark:text-amber-400" />
                    <div className="flex flex-col leading-none">
                        <span className="text-[9px] text-slate-500 dark:text-slate-500 font-bold uppercase">Avg Wait</span>
                        <span className="text-sm font-mono font-bold text-amber-600 dark:text-amber-400">{avgWaiting}</span>
                    </div>
                </div>
            </div>
            
            {isFinished && onDownload && (
                <button 
                    onClick={onDownload}
                    className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-[10px] font-bold uppercase rounded-lg transition-colors shadow-lg shadow-blue-500/20 dark:shadow-blue-900/20 border border-blue-400/20"
                >
                    <Download size={12} />
                    Download Report
                </button>
            )}
        </div>
      </div>
      
      {/* Table - Scrollable Area */}
      <div className="overflow-auto flex-1 custom-scrollbar">
        <table className="w-full text-xs text-left border-collapse relative">
          <thead className="bg-slate-100/90 dark:bg-slate-950/90 text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider sticky top-0 z-10 backdrop-blur-sm shadow-sm transition-colors duration-300">
            <tr>
              <th className="px-6 py-3 border-b border-slate-200 dark:border-slate-800">PID</th>
              <th className="px-6 py-3 border-b border-slate-200 dark:border-slate-800 text-right">Arrival</th>
              <th className="px-6 py-3 border-b border-slate-200 dark:border-slate-800 text-right">Burst</th>
              <th className="px-6 py-3 border-b border-slate-200 dark:border-slate-800 text-right">Prio</th>
              <th className="px-6 py-3 border-b border-slate-200 dark:border-slate-800 text-right hidden sm:table-cell">Finish</th>
              <th className="px-6 py-3 border-b border-slate-200 dark:border-slate-800 text-right text-emerald-600 dark:text-emerald-500">TAT</th>
              <th className="px-6 py-3 border-b border-slate-200 dark:border-slate-800 text-right text-amber-600 dark:text-amber-500">Wait</th>
              <th className="px-6 py-3 border-b border-slate-200 dark:border-slate-800 text-center">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-slate-800/50 bg-white/20 dark:bg-slate-900/20 transition-colors duration-300">
            {processes.map((p) => (
              <tr key={p.id} className="group hover:bg-black/[0.02] dark:hover:bg-white/[0.02] transition-colors">
                <td className="px-6 py-2.5 font-bold text-slate-900 dark:text-white">
                    <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color }}></span>
                        {p.id}
                    </div>
                </td>
                <td className="px-6 py-2.5 text-right text-slate-700 dark:text-slate-300 font-mono">{p.arrivalTime}</td>
                <td className="px-6 py-2.5 text-right text-slate-700 dark:text-slate-300 font-mono">{p.burstTime}</td>
                <td className="px-6 py-2.5 text-right text-slate-700 dark:text-slate-300 font-mono">{p.priority}</td>
                <td className="px-6 py-2.5 text-right text-slate-500 dark:text-slate-400 font-mono hidden sm:table-cell">{p.completionTime ?? '-'}</td>
                <td className="px-6 py-2.5 text-right font-mono font-medium text-emerald-600 dark:text-emerald-400">
                    {p.state === 'COMPLETED' ? p.turnaroundTime : '-'}
                </td>
                <td className="px-6 py-2.5 text-right font-mono font-medium text-amber-600 dark:text-amber-400">{p.waitingTime}</td>
                <td className="px-6 py-2.5 text-center">
                   <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold border shadow-sm ${
                       p.state === 'COMPLETED' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400' :
                       p.state === 'RUNNING' ? 'bg-blue-500/10 border-blue-500/20 text-blue-600 dark:text-blue-400 animate-pulse' :
                       p.state === 'READY' ? 'bg-amber-500/10 border-amber-500/20 text-amber-600 dark:text-amber-400' :
                       'bg-slate-200 dark:bg-slate-800 text-slate-500 dark:text-slate-500 border-slate-300 dark:border-slate-700'
                   }`}>
                       {p.state === 'COMPLETED' && <CheckCircle2 size={10} />}
                       {p.state}
                   </span>
                </td>
              </tr>
            ))}
            {processes.length === 0 && (
                <tr>
                    <td colSpan={8} className="px-6 py-8 text-center text-slate-600 italic">
                        No processes in memory
                    </td>
                </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default StatsTable;