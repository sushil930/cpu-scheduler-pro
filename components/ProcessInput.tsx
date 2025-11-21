import React, { useState, useRef, useEffect } from 'react';
import { Plus, RotateCcw, Play, Pause, FastForward, Dna, Zap, Settings2, ChevronDown } from 'lucide-react';
import { AlgorithmType } from '../types';

interface ProcessInputProps {
  onAdd: (at: number, bt: number, prio: number, deadline: number, period: number) => void;
  onRandomize: () => void;
  onReset: () => void;
  onRun: () => void;
  onPause: () => void;
  onStep: () => void;
  isPlaying: boolean;
  algorithm: AlgorithmType;
  setAlgorithm: (a: AlgorithmType) => void;
  quantum: number;
  setQuantum: (q: number) => void;
  algorithms: { value: AlgorithmType; label: string, description: string }[];
}

const ProcessInput: React.FC<ProcessInputProps> = ({ 
    onAdd, onRandomize, onReset, onRun, onPause, onStep, 
    isPlaying, algorithm, setAlgorithm, algorithms, quantum, setQuantum 
}) => {
  const [at, setAt] = useState(0);
  const [bt, setBt] = useState(5);
  const [prio, setPrio] = useState(1);
  const [deadline, setDeadline] = useState(10);
  const [period, setPeriod] = useState(5);
  
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    onAdd(at, bt, prio, deadline, period);
  };

  const showQuantum = algorithm === AlgorithmType.RR;
  const showPriority = algorithm.includes('PRIORITY');
  const showDeadlines = algorithm === AlgorithmType.EDF;
  const showPeriods = algorithm === AlgorithmType.RMS;

  const currentAlgo = algorithms.find(a => a.value === algorithm);

  return (
    <div className="w-full bg-slate-900/60 backdrop-blur-md rounded-2xl border border-white/5 shadow-xl flex flex-col shrink-0 relative">
      {/* Header / Algorithm Select */}
      <div className="p-4 border-b border-white/5 bg-gradient-to-r from-slate-900/80 to-slate-900/40 rounded-t-2xl relative z-50">
         <div className="flex items-center gap-2 mb-3 text-blue-400 text-[10px] font-bold uppercase tracking-wider">
            <Settings2 size={12} /> Configuration
         </div>
         
         <div className="space-y-3">
             {/* Custom Dropdown */}
             <div className="relative" ref={dropdownRef}>
                <button 
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                    className="w-full bg-slate-950/80 text-left text-white border border-slate-700 rounded-lg px-3 py-2.5 flex items-center justify-between hover:border-blue-500/50 hover:shadow-[0_0_15px_-3px_rgba(59,130,246,0.2)] transition-all group"
                >
                    <span className="text-xs font-bold truncate mr-2">{currentAlgo?.label}</span>
                    <ChevronDown size={14} className={`text-slate-500 transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`} />
                </button>

                {/* Dropdown Menu */}
                {isDropdownOpen && (
                    <div className="absolute top-full left-0 w-full mt-1 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl shadow-black/50 max-h-[300px] overflow-y-auto custom-scrollbar divide-y divide-slate-800/50 overflow-hidden ring-1 ring-white/5">
                        {algorithms.map(algo => (
                            <button
                                key={algo.value}
                                onClick={() => {
                                    setAlgorithm(algo.value);
                                    setIsDropdownOpen(false);
                                }}
                                className={`w-full text-left px-3 py-3 hover:bg-slate-800/80 transition-colors flex items-start gap-3 group
                                    ${algorithm === algo.value ? 'bg-blue-500/5' : ''}
                                `}
                            >
                                <div className={`mt-0.5 w-3 h-3 rounded-full border flex items-center justify-center shrink-0 transition-colors
                                    ${algorithm === algo.value ? 'border-blue-500 bg-blue-500' : 'border-slate-600 group-hover:border-slate-400'}`}
                                >
                                    {algorithm === algo.value && <div className="w-1 h-1 bg-white rounded-full" />}
                                </div>
                                <div>
                                    <div className={`text-xs font-bold transition-colors ${algorithm === algo.value ? 'text-blue-400' : 'text-slate-200 group-hover:text-white'}`}>
                                        {algo.label}
                                    </div>
                                    <div className="text-[10px] text-slate-500 leading-tight mt-0.5 group-hover:text-slate-400">
                                        {algo.description}
                                    </div>
                                </div>
                            </button>
                        ))}
                    </div>
                )}
             </div>

             {/* Quantum Input (Conditional) */}
             {showQuantum && (
                 <div className="flex items-center bg-slate-950/50 border border-slate-800 rounded-lg px-3 py-2 animate-in fade-in slide-in-from-top-2 duration-300">
                    <span className="text-[10px] text-slate-400 font-bold mr-auto uppercase tracking-wide">Time Quantum</span>
                    <div className="flex items-center gap-1 bg-slate-900 rounded p-0.5 border border-slate-800">
                        <button 
                            onClick={() => setQuantum(Math.max(1, quantum - 1))}
                            className="w-6 h-6 flex items-center justify-center rounded hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
                        >-</button>
                        <span className="text-xs font-mono font-bold text-white w-6 text-center">{quantum}</span>
                        <button 
                             onClick={() => setQuantum(quantum + 1)}
                             className="w-6 h-6 flex items-center justify-center rounded hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
                        >+</button>
                    </div>
                 </div>
             )}
         </div>
      </div>

      {/* Process Entry */}
      <div className="p-4 bg-slate-900/30 relative z-10">
        <div className="flex items-center gap-2 mb-3 text-emerald-400 text-[10px] font-bold uppercase tracking-wider">
            <Dna size={12} /> Process Injection
         </div>
        <form onSubmit={handleAdd} className="grid grid-cols-4 gap-2">
            <div className="col-span-2 md:col-span-1 space-y-1">
                <label className="text-[9px] text-slate-500 font-bold uppercase ml-1">Arrival</label>
                <input type="number" min="0" value={at} onChange={e => setAt(parseInt(e.target.value))} className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-white focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 outline-none font-mono transition-all" />
            </div>
            <div className="col-span-2 md:col-span-1 space-y-1">
                <label className="text-[9px] text-slate-500 font-bold uppercase ml-1">Burst</label>
                <input type="number" min="1" value={bt} onChange={e => setBt(parseInt(e.target.value))} className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-white focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 outline-none font-mono transition-all" />
            </div>

             <div className={`col-span-2 md:col-span-1 space-y-1 transition-opacity duration-200 ${!showPriority && 'opacity-30 pointer-events-none grayscale'}`}>
                <label className="text-[9px] text-slate-500 font-bold uppercase ml-1">Priority</label>
                <input type="number" value={prio} onChange={e => setPrio(parseInt(e.target.value))} className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-white focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 outline-none font-mono" />
            </div>

            <div className={`col-span-2 md:col-span-1 space-y-1 transition-opacity duration-200 ${!showDeadlines && !showPeriods && 'opacity-30 pointer-events-none grayscale'}`}>
                 <label className="text-[9px] text-slate-500 font-bold uppercase ml-1">
                    {showDeadlines ? 'Deadline' : showPeriods ? 'Period' : 'Extra'}
                 </label>
                 <input 
                    type="number" 
                    min="1"
                    value={showDeadlines ? deadline : period} 
                    onChange={e => showDeadlines ? setDeadline(parseInt(e.target.value)) : setPeriod(parseInt(e.target.value))} 
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-white focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 outline-none font-mono" 
                />
            </div>

            <button type="submit" className="col-span-3 mt-2 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white rounded-lg py-2 text-xs font-bold shadow-lg shadow-emerald-900/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2 border border-emerald-400/20">
                <Plus size={14} /> Add Process
            </button>
            
            <button type="button" onClick={onRandomize} className="col-span-1 mt-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg py-2 text-[10px] font-bold border border-slate-700 transition-all">
                Random
            </button>
        </form>
      </div>

      {/* Controls */}
      <div className="p-3 bg-slate-950/50 border-t border-white/5 flex gap-2 rounded-b-2xl relative z-10">
        <button 
            onClick={isPlaying ? onPause : onRun}
            className={`flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-xs font-bold transition-all shadow-lg ${
                isPlaying 
                ? 'bg-amber-500/10 text-amber-500 border border-amber-500/50 hover:bg-amber-500/20' 
                : 'bg-blue-600 text-white hover:bg-blue-500 shadow-blue-600/20'
            }`}
        >
            {isPlaying ? <Pause size={14} fill="currentColor"/> : <Play size={14} fill="currentColor"/>}
            {isPlaying ? 'PAUSE' : 'RUN'}
        </button>
        
        <button 
            onClick={onStep}
            disabled={isPlaying}
            className="px-3 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed text-slate-300 border border-slate-700 transition-all group"
            title="Step Forward"
        >
            <FastForward size={14} className="group-active:translate-x-0.5 transition-transform"/>
        </button>

        <button 
            onClick={onReset}
            className="px-3 rounded-xl bg-slate-800 hover:bg-red-900/30 hover:text-red-400 hover:border-red-900/50 text-slate-400 border border-slate-700 transition-all group"
            title="Reset"
        >
            <RotateCcw size={14} className="group-hover:-rotate-180 transition-transform duration-500"/>
        </button>
      </div>
    </div>
  );
};

export default ProcessInput;