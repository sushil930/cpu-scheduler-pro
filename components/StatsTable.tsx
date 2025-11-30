import React from 'react';
import { Process, ProcessState } from '../types';
import { Activity, Clock, CheckCircle2, Download, Trash2 } from 'lucide-react';

interface StatsTableProps {
  processes: Process[];
  onDeleteProcess: (id: string) => void;
  onDownload?: () => void;
}

const StatsTable: React.FC<StatsTableProps> = ({ processes, onDeleteProcess, onDownload }) => {
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
              <th className="px-6 py-3 border-b border-slate-200 dark:border-slate-800 text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            {processes.map((process) => (
              <tr key={process.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-300">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: process.color }}></span>
                    {process.id}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-300 text-right">
                  {process.arrivalTime}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-300 text-right">
                  {process.burstTime}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-300 text-right">
                  {process.priority}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400 hidden sm:table-cell text-right">
                  {process.completionTime ?? '-'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-emerald-600 dark:text-emerald-400 text-right">
                  {process.state === 'COMPLETED' ? process.turnaroundTime : '-'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-amber-600 dark:text-amber-400 text-right">
                  {process.waitingTime}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                  <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold border shadow-sm ${
                      process.state === 'COMPLETED' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400' :
                      process.state === 'RUNNING' ? 'bg-blue-500/10 border-blue-500/20 text-blue-600 dark:text-blue-400 animate-pulse' :
                      process.state === 'READY' ? 'bg-amber-500/10 border-amber-500/20 text-amber-600 dark:text-amber-400' :
                      'bg-slate-200 dark:bg-slate-800 text-slate-500 dark:text-slate-500 border-slate-300 dark:border-slate-700'
                  }`}>
                      {process.state === 'COMPLETED' && <CheckCircle2 size={10} />}
                      {process.state}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                  <button
                    onClick={() => onDeleteProcess(process.id)}
                    className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 transition-colors p-1.5 rounded-md hover:bg-red-50 dark:hover:bg-red-900/20"
                    title="Delete Process"
                  >
                    <Trash2 size={16} />
                  </button>
                </td>
              </tr>
            ))}
            {processes.length === 0 && (
                <tr>
                    <td colSpan={9} className="px-6 py-8 text-center text-slate-600 dark:text-slate-400 italic">
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