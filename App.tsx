import React, { useState, useEffect, useCallback } from 'react';
import { 
  Process, 
  ProcessState, 
  AlgorithmType, 
  GanttBlock,
  SimulationConfig
} from './types';
import { ALGORITHMS, INITIAL_PROCESSES, PROCESS_COLORS } from './constants';
import { advanceSimulationTick } from './services/schedulerUtils';
import GanttChart from './components/GanttChart';
import StatsTable from './components/StatsTable';
import ProcessInput from './components/ProcessInput';
import ReadyQueue from './components/ReadyQueue';
import { Cpu, Clock, BarChart3, GraduationCap, Sparkles, Github, Linkedin, Instagram, Sun, Moon } from 'lucide-react';

const App: React.FC = () => {
  // --- State ---
  const [isDarkMode, setIsDarkMode] = useState(true);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  const [processes, setProcesses] = useState<Process[]>(
    INITIAL_PROCESSES.map((p, i) => ({
      ...p,
      remainingTime: p.burstTime,
      state: ProcessState.WAITING,
      startTime: null,
      completionTime: null,
      waitingTime: 0,
      turnaroundTime: 0,
      color: PROCESS_COLORS[i % PROCESS_COLORS.length]
    }))
  );
  
  const [tick, setTick] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [ganttData, setGanttData] = useState<GanttBlock[]>([]);
  const [readyQueue, setReadyQueue] = useState<string[]>([]);
  const [cpuId, setCpuId] = useState<string | null>(null);
  
  // Config
  const [algorithm, setAlgorithm] = useState<AlgorithmType>(AlgorithmType.FCFS);
  const [timeQuantum, setTimeQuantum] = useState(2);
  const [quantumClock, setQuantumClock] = useState(0); 
  const [speed, setSpeed] = useState(800);

  // --- Actions ---

  const handleReset = () => {
    setIsPlaying(false);
    setTick(0);
    setGanttData([]);
    setReadyQueue([]);
    setCpuId(null);
    setQuantumClock(0);
    setProcesses([]);
  };

  const handleStep = useCallback(() => {
    if (processes.every(p => p.state === ProcessState.COMPLETED)) {
      setIsPlaying(false);
      return;
    }

    const config: SimulationConfig = {
      algorithm,
      timeQuantum,
      contextSwitchOverhead: 0
    };

    const nextState = advanceSimulationTick(
      tick,
      processes,
      config,
      readyQueue,
      cpuId,
      quantumClock
    );

    setProcesses(nextState.processes);
    setCpuId(nextState.cpuId);
    setReadyQueue(nextState.readyQueue);
    setQuantumClock(nextState.quantumClock);
    setTick(t => t + 1);

    setGanttData(prev => {
      const lastBlock = prev[prev.length - 1];
      const currentPid = nextState.executedId || 'IDLE';
      const currentColor = nextState.executedId 
        ? nextState.processes.find(p => p.id === nextState.executedId)?.color || '#333' 
        : '#1e293b';

      if (lastBlock && lastBlock.processId === currentPid) {
        return [
          ...prev.slice(0, -1),
          { ...lastBlock, endTime: tick + 1 }
        ];
      } else {
        return [
          ...prev,
          { processId: currentPid, startTime: tick, endTime: tick + 1, color: currentColor }
        ];
      }
    });

  }, [tick, processes, algorithm, timeQuantum, readyQueue, cpuId, quantumClock]);

  const generateReport = () => {
    const algoName = ALGORITHMS.find(a => a.value === algorithm)?.label || algorithm;
    const completed = processes.filter(p => p.state === ProcessState.COMPLETED);
    
    // 1. Calculations
    const totalTime = ganttData.length > 0 ? ganttData[ganttData.length - 1].endTime : 0;
    const busyTime = ganttData.filter(b => b.processId !== 'IDLE').reduce((acc, b) => acc + (b.endTime - b.startTime), 0);
    const cpuUtil = totalTime > 0 ? ((busyTime / totalTime) * 100).toFixed(2) : '0.00';
    
    const avgTat = completed.length ? (completed.reduce((a, b) => a + b.turnaroundTime, 0) / completed.length).toFixed(2) : '0.00';
    const avgWt = completed.length ? (completed.reduce((a, b) => a + b.waitingTime, 0) / completed.length).toFixed(2) : '0.00';
    
    // Response Time: Start Time - Arrival Time
    // Note: startTime in process state is the *first* time it got CPU.
    const avgRt = completed.length 
        ? (completed.reduce((a, b) => a + ((b.startTime ?? b.arrivalTime) - b.arrivalTime), 0) / completed.length).toFixed(2) 
        : '0.00';
    
    const throughput = totalTime > 0 ? (completed.length / totalTime).toFixed(4) : '0.0000';

    // 2. Event Log Generation
    // We reconstruct the chronological flow from Gantt and Process data
    type LogEvent = { time: number; type: 'ARRIVAL' | 'START' | 'PREEMPT' | 'COMPLETE'; pid: string; details: string; color: string };
    const events: LogEvent[] = [];

    // Arrivals
    processes.forEach(p => {
        events.push({
            time: p.arrivalTime,
            type: 'ARRIVAL',
            pid: p.id,
            details: `Arrived in Ready Queue (BT: ${p.burstTime}, Prio: ${p.priority})`,
            color: '#64748b'
        });
    });

    // Gantt Events
    ganttData.forEach(block => {
        if (block.processId === 'IDLE') return;
        
        // Start
        events.push({
            time: block.startTime,
            type: 'START',
            pid: block.processId,
            details: `Allocated to CPU`,
            color: block.color
        });

        // End (Check if complete or preempt)
        const proc = processes.find(p => p.id === block.processId);
        const isComplete = proc?.completionTime === block.endTime;
        
        if (isComplete) {
            events.push({
                time: block.endTime,
                type: 'COMPLETE',
                pid: block.processId,
                details: `Finished execution`,
                color: '#10b981'
            });
        } else {
            events.push({
                time: block.endTime,
                type: 'PREEMPT',
                pid: block.processId,
                details: `Preempted / Time Quantum Expired`,
                color: '#f59e0b'
            });
        }
    });

    // Sort events: Time ASC, then Arrivals first, then Completes, then Starts
    events.sort((a, b) => {
        if (a.time !== b.time) return a.time - b.time;
        const order = { 'ARRIVAL': 1, 'COMPLETE': 2, 'PREEMPT': 3, 'START': 4 };
        return order[a.type] - order[b.type];
    });


    // 3. HTML Construction
    const ganttHtml = ganttData.map(block => {
      const widthPct = ((block.endTime - block.startTime) / totalTime) * 100;
      const isIdle = block.processId === 'IDLE';
      return `
        <div style="width: ${widthPct}%; background-color: ${isIdle ? '#f1f5f9' : block.color}; display: flex; flex-direction: column; align-items: center; justify-content: center; height: 50px; border-right: 1px solid #fff; font-size: 11px; font-weight: bold; position: relative; color: ${isIdle ? '#94a3b8' : 'white'}; box-sizing: border-box;">
          ${isIdle ? 'IDLE' : block.processId}
          <span style="position: absolute; bottom: -20px; left: -2px; font-size: 9px; color: #64748b; font-family: monospace;">${block.startTime}</span>
        </div>
      `;
    }).join('');

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>CPU Scheduling Report - ${algoName}</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&family=JetBrains+Mono:wght@400;700&display=swap');
          body { font-family: 'Inter', sans-serif; padding: 40px; color: #1e293b; max-width: 1200px; margin: 0 auto; background-color: #fff; }
          h1 { color: #0f172a; margin-bottom: 5px; font-size: 28px; }
          .subtitle { color: #64748b; margin-bottom: 30px; font-size: 14px; }
          h2 { color: #334155; margin-top: 40px; font-size: 18px; border-bottom: 2px solid #e2e8f0; padding-bottom: 10px; margin-bottom: 20px; }
          
          /* Metrics Grid */
          .metrics-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 15px; margin-bottom: 30px; }
          .metric-card { background: #f8fafc; padding: 15px; border-radius: 8px; border: 1px solid #e2e8f0; }
          .metric-label { font-size: 11px; text-transform: uppercase; color: #64748b; font-weight: 700; letter-spacing: 0.05em; margin-bottom: 5px; }
          .metric-value { font-size: 24px; font-family: 'JetBrains Mono', monospace; font-weight: 700; color: #0f172a; }
          
          /* Table */
          table { width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 13px; }
          th, td { padding: 12px; border-bottom: 1px solid #e2e8f0; text-align: left; }
          th { background-color: #f1f5f9; font-weight: 600; color: #475569; text-transform: uppercase; font-size: 11px; letter-spacing: 0.05em; }
          td { font-family: 'JetBrains Mono', monospace; }
          tr:last-child td { border-bottom: none; }
          
          /* Gantt */
          .gantt-wrapper { margin: 20px 0 50px 0; padding: 10px; background: #fff; border: 1px solid #cbd5e1; border-radius: 8px; }
          .gantt-container { display: flex; width: 100%; height: 50px; position: relative; background: #f1f5f9; border-radius: 4px; overflow: hidden; }
          
          /* Event Log */
          .log-table th { background-color: #fff; border-bottom: 2px solid #0f172a; color: #0f172a; }
          .log-row-ARRIVAL { background-color: #f8fafc; color: #64748b; }
          .log-row-START { background-color: #fff; }
          .log-row-COMPLETE { background-color: #ecfdf5; }
          .log-row-PREEMPT { background-color: #fffbeb; }
          .badge { padding: 2px 6px; border-radius: 4px; color: white; font-weight: bold; font-size: 11px; }
          
          /* Glossary */
          .glossary { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; background: #f8fafc; padding: 20px; border-radius: 8px; border: 1px solid #e2e8f0; font-size: 12px; color: #475569; }
          .glossary dt { font-weight: 700; color: #0f172a; margin-bottom: 4px; }
          .glossary dd { margin: 0 0 15px 0; line-height: 1.5; }
          
          /* Footer */
          .footer { margin-top: 50px; text-align: center; font-size: 11px; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 20px; }
        </style>
      </head>
      <body>
        <div style="display: flex; justify-content: space-between; align-items: flex-start;">
            <div>
                <h1>Scheduling Algorithm Report</h1>
                <div class="subtitle">
                    Generated by CPU Scheduler Pro &bull; ${new Date().toLocaleString()}
                </div>
            </div>
            <div style="text-align: right; font-family: 'JetBrains Mono', monospace; font-size: 12px; background: #0f172a; color: white; padding: 10px 20px; border-radius: 6px;">
                ALGORITHM: ${algoName.toUpperCase()}<br>
                ${algorithm === AlgorithmType.RR ? `TIME QUANTUM: ${timeQuantum}ms` : 'NON-PREEMPTIVE / STANDARD'}
            </div>
        </div>

        <!-- Key Metrics -->
        <h2>1. Executive Summary</h2>
        <div class="metrics-grid">
            <div class="metric-card">
                <div class="metric-label">Avg Turnaround Time</div>
                <div class="metric-value" style="color: #10b981;">${avgTat} <span style="font-size: 12px;">ms</span></div>
            </div>
            <div class="metric-card">
                <div class="metric-label">Avg Waiting Time</div>
                <div class="metric-value" style="color: #f59e0b;">${avgWt} <span style="font-size: 12px;">ms</span></div>
            </div>
            <div class="metric-card">
                <div class="metric-label">Avg Response Time</div>
                <div class="metric-value" style="color: #3b82f6;">${avgRt} <span style="font-size: 12px;">ms</span></div>
            </div>
            <div class="metric-card">
                <div class="metric-label">CPU Utilization</div>
                <div class="metric-value">${cpuUtil}%</div>
            </div>
            <div class="metric-card">
                <div class="metric-label">Throughput</div>
                <div class="metric-value">${throughput} <span style="font-size: 12px;">p/ms</span></div>
            </div>
        </div>

        <!-- Gantt -->
        <h2>2. Execution Gantt Chart</h2>
        <div class="gantt-wrapper">
            <div class="gantt-container">
                ${ganttHtml}
            </div>
            <div style="text-align: right; font-family: 'JetBrains Mono'; font-size: 10px; color: #64748b; margin-top: 25px;">
                Total Simulation Time: ${totalTime}ms
            </div>
        </div>

        <!-- Detailed Stats -->
        <h2>3. Process Statistics</h2>
        <table>
          <thead>
            <tr>
              <th>PID</th>
              <th style="text-align: right;">Arrival</th>
              <th style="text-align: right;">Burst</th>
              <th style="text-align: right;">Priority</th>
              <th style="text-align: right;">Start Time</th>
              <th style="text-align: right;">Finish Time</th>
              <th style="text-align: right; color: #10b981;">Turnaround</th>
              <th style="text-align: right; color: #f59e0b;">Waiting</th>
              <th style="text-align: right; color: #3b82f6;">Response</th>
            </tr>
          </thead>
          <tbody>
            ${processes.map(p => `
              <tr>
                <td><span class="badge" style="background-color: ${p.color}">${p.id}</span></td>
                <td style="text-align: right;">${p.arrivalTime}</td>
                <td style="text-align: right;">${p.burstTime}</td>
                <td style="text-align: right;">${p.priority}</td>
                <td style="text-align: right;">${p.startTime ?? '-'}</td>
                <td style="text-align: right;">${p.completionTime ?? '-'}</td>
                <td style="text-align: right; font-weight: bold; color: #10b981;">${p.turnaroundTime}</td>
                <td style="text-align: right; font-weight: bold; color: #f59e0b;">${p.waitingTime}</td>
                <td style="text-align: right; font-weight: bold; color: #3b82f6;">${(p.startTime ?? 0) - p.arrivalTime}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <!-- Chronological Log -->
        <h2>4. Chronological Event Log</h2>
        <table class="log-table">
            <thead>
                <tr>
                    <th style="width: 60px;">Time</th>
                    <th style="width: 80px;">PID</th>
                    <th style="width: 100px;">Event Type</th>
                    <th>Description</th>
                </tr>
            </thead>
            <tbody>
                ${events.map(e => `
                    <tr class="log-row-${e.type}">
                        <td style="font-weight: bold;">${e.time}</td>
                        <td>
                            ${e.type !== 'ARRIVAL' ? `<span class="badge" style="background-color: ${e.color}">${e.pid}</span>` : `<span style="color: #64748b; font-weight: bold;">${e.pid}</span>`}
                        </td>
                        <td style="font-size: 10px; font-weight: 700; text-transform: uppercase;">${e.type}</td>
                        <td>${e.details}</td>
                    </tr>
                `).join('')}
            </tbody>
        </table>

        <!-- Glossary -->
        <h2>5. Definitions & Formulas</h2>
        <dl class="glossary">
            <div>
                <dt>Turnaround Time (TAT)</dt>
                <dd>The total time taken from submission of the process to its completion. <br><code>TAT = Completion Time - Arrival Time</code></dd>
                
                <dt>Waiting Time (WT)</dt>
                <dd>The total time a process spends waiting in the ready queue. <br><code>WT = Turnaround Time - Burst Time</code></dd>
            </div>
            <div>
                <dt>Response Time (RT)</dt>
                <dd>The time from submission of a request until the first response is produced. <br><code>RT = Start Time - Arrival Time</code></dd>

                <dt>CPU Utilization</dt>
                <dd>The percentage of time the CPU was busy executing processes versus being idle.</dd>
            </div>
        </dl>

        <div class="footer">
            Simulator made by <strong>Sushil Patel</strong> with <strong>Gemini 3 Pro</strong>, course MCA
        </div>
      </body>
      </html>
    `;

    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `CPU_Report_${algorithm}_${new Date().toISOString().split('T')[0]}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // --- Effects ---
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (isPlaying) {
      interval = setInterval(handleStep, speed);
    }
    return () => clearInterval(interval);
  }, [isPlaying, handleStep, speed]);

  // --- Handlers ---
  const addProcess = (at: number, bt: number, prio: number, deadline: number, period: number) => {
    const nextId = `P${processes.length + 1}`;
    const newProc: Process = {
      id: nextId,
      arrivalTime: at,
      burstTime: bt,
      priority: prio,
      deadline: deadline,
      period: period,
      remainingTime: bt,
      state: ProcessState.WAITING,
      startTime: null,
      completionTime: null,
      waitingTime: 0,
      turnaroundTime: 0,
      color: PROCESS_COLORS[processes.length % PROCESS_COLORS.length]
    };
    setProcesses([...processes, newProc]);
  };

  const deleteProcess = (processId: string) => {
    setProcesses(prev => prev.filter(p => p.id !== processId));
    setReadyQueue(prev => prev.filter(id => id !== processId));
    if (cpuId === processId) {
      setCpuId(null);
    }
  };

  const randomize = () => {
    handleReset();
    const count = 5;
    const newProcs: Process[] = [];
    for (let i = 0; i < count; i++) {
        const bt = Math.floor(Math.random() * 8) + 2;
        newProcs.push({
            id: `P${i+1}`,
            arrivalTime: Math.floor(Math.random() * 8),
            burstTime: bt,
            remainingTime: bt,
            priority: Math.floor(Math.random() * 5) + 1,
            deadline: Math.floor(Math.random() * 20) + 5,
            period: Math.floor(Math.random() * 15) + 5,
            state: ProcessState.WAITING,
            startTime: null, completionTime: null, waitingTime: 0, turnaroundTime: 0,
            color: PROCESS_COLORS[i % PROCESS_COLORS.length]
        });
    }
    setProcesses(newProcs.sort((a,b) => a.arrivalTime - b.arrivalTime));
  };

  // --- Render ---
  return (
    <div className="h-screen w-screen bg-slate-50 dark:bg-[#0f172a] text-slate-900 dark:text-slate-200 font-sans selection:bg-blue-500/30 flex flex-col overflow-hidden transition-colors duration-300">
      {/* Background Effects */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#cbd5e1_1px,transparent_1px),linear-gradient(to_bottom,#cbd5e1_1px,transparent_1px)] dark:bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-20"></div>
        <div className="absolute top-0 left-0 right-0 h-96 bg-blue-500/5 dark:bg-blue-900/10 blur-[120px]"></div>
      </div>

      {/* Header */}
      <header className="flex-shrink-0 relative z-20 flex items-center justify-between bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl border-b border-slate-200 dark:border-white/5 px-6 py-3 shadow-md transition-colors duration-300">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg shadow-lg shadow-blue-500/20">
              <Cpu size={20} className="text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight leading-none">
                CPU Scheduler <span className="text-blue-500 dark:text-blue-400 font-light">Pro</span>
              </h1>
              <p className="text-slate-500 dark:text-slate-400 text-[10px] font-medium tracking-wide uppercase">
                Operating System Logic Visualizer
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
             {/* Creator Info */}
             <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 bg-white/80 dark:bg-slate-900/80 rounded-lg border border-slate-200 dark:border-slate-800 transition-colors duration-300">
                <GraduationCap size={14} className="text-blue-500 dark:text-blue-400" />
                <span className="text-[11px] text-slate-500 dark:text-slate-400">
                  Made by <span className="text-slate-700 dark:text-slate-200 font-semibold">Sushil Patel</span>
                </span>
                <div className="flex items-center gap-2 ml-1">
                  <a href="https://github.com/sushil930" target="_blank" rel="noopener noreferrer" className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 dark:text-slate-500 hover:text-slate-900 dark:hover:text-white transition-all" title="GitHub">
                    <Github size={12} />
                  </a>
                  <a href="https://www.linkedin.com/in/sushil-patel-dev/" target="_blank" rel="noopener noreferrer" className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 dark:text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 transition-all" title="LinkedIn">
                    <Linkedin size={12} />
                  </a>
                  <a href="https://www.instagram.com/suseal__/" target="_blank" rel="noopener noreferrer" className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 dark:text-slate-500 hover:text-pink-600 dark:hover:text-pink-400 transition-all" title="Instagram">
                    <Instagram size={12} />
                  </a>
                </div>
             </div>

             <div className="h-8 w-px bg-slate-200 dark:bg-slate-800 hidden lg:block transition-colors duration-300"></div>
             <div className="flex items-center gap-3 px-3 py-1.5 bg-white/80 dark:bg-slate-900/80 rounded-lg border border-slate-200 dark:border-slate-800 shadow-sm dark:shadow-inner transition-colors duration-300">
                <div className="flex flex-col">
                    <span className="text-[9px] uppercase text-slate-400 dark:text-slate-500 font-bold tracking-wider">System Tick</span>
                    <span className="text-lg font-mono font-bold text-slate-700 dark:text-white tabular-nums flex items-center gap-2 leading-none">
                        <Clock size={14} className="text-blue-500"/> 
                        {tick.toString().padStart(3, '0')}
                    </span>
                </div>
             </div>

             <div className="h-8 w-px bg-slate-200 dark:bg-slate-800 hidden md:block transition-colors duration-300"></div>

             <div className="px-2 hidden md:block">
                <div className="flex justify-between text-[9px] text-slate-400 dark:text-slate-500 font-bold uppercase mb-1">
                    <span>Sim Speed</span>
                    <span>{Math.round((1600 - speed)/10)}%</span>
                </div>
                <input 
                    type="range" 
                    min="100" 
                    max="1500" 
                    step="100"
                    value={1600 - speed} 
                    onChange={(e) => setSpeed(1600 - parseInt(e.target.value))}
                    className="w-24 h-1.5 bg-slate-200 dark:bg-slate-800 rounded-full appearance-none cursor-pointer accent-blue-500 hover:accent-blue-400 transition-all"
                />
             </div>

             <div className="h-8 w-px bg-slate-200 dark:bg-slate-800 hidden md:block transition-colors duration-300"></div>

             <button 
                onClick={() => setIsDarkMode(!isDarkMode)}
                className="p-2 rounded-lg bg-white/80 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 hover:text-blue-500 dark:hover:text-blue-400 transition-all shadow-sm"
                title={isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
             >
                {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
             </button>
          </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 min-h-0 relative z-10 p-4 pt-4 w-full max-w-[1920px] mx-auto">
        <div className="h-full grid grid-cols-1 xl:grid-cols-12 gap-4">
          
          {/* Left Column: Input & Queue */}
          <div className="xl:col-span-4 flex flex-col gap-4 h-full min-h-0">
            <div className="flex-shrink-0">
              <ProcessInput 
                onAdd={addProcess}
                onRandomize={randomize}
                onReset={handleReset}
                onRun={() => setIsPlaying(true)}
                onPause={() => setIsPlaying(false)}
                onStep={handleStep}
                isPlaying={isPlaying}
                algorithm={algorithm}
                setAlgorithm={val => { handleReset(); setAlgorithm(val); }}
                algorithms={ALGORITHMS}
                quantum={timeQuantum}
                setQuantum={setTimeQuantum}
              />
            </div>
            
            <div className="flex-shrink-0">
              <ReadyQueue queueIds={readyQueue} processes={processes} cpuId={cpuId} />
            </div>
          </div>

          {/* Right Column: Visualization & Stats */}
          <div className="xl:col-span-8 flex flex-col gap-4 h-full min-h-0">
            <div className="flex-shrink-0">
              <GanttChart data={ganttData} totalTime={tick} />
            </div>
            
            <div className="flex-1 min-h-0">
               <StatsTable 
              processes={processes} 
              onDeleteProcess={deleteProcess}
              onDownload={generateReport} 
            />
            </div>
            
            {/* Info Footer */}
            <div className="flex-shrink-0 flex items-center gap-3 text-[10px] text-slate-500 dark:text-slate-500 px-2 py-1 border-t border-slate-200 dark:border-white/5 transition-colors duration-300">
                <BarChart3 size={12} />
                <span>Real-time calculation of Turnaround Time (TAT), Waiting Time (WT), and CPU metrics.</span>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default App;