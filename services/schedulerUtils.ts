import { AlgorithmType, Process, ProcessState, SimulationConfig } from '../types';

// Helper to get processes that have arrived and are not complete
export const getAvailableProcesses = (processes: Process[], currentTick: number): Process[] => {
  return processes.filter(
    (p) => p.arrivalTime <= currentTick && p.state !== ProcessState.COMPLETED
  );
};

// Pure logic functions for selecting the next process
const selectProcess = (
  candidates: Process[],
  config: SimulationConfig,
  currentTick: number,
  currentRunningId: string | null
): Process | null => {
  if (candidates.length === 0) return null;

  switch (config.algorithm) {
    case AlgorithmType.FCFS:
      return candidates.sort((a, b) => a.arrivalTime - b.arrivalTime || parseInt(a.id.slice(1)) - parseInt(b.id.slice(1)))[0];

    case AlgorithmType.SJF:
      // Non-preemptive: If cpu has a running process, it continues unless it finishes (which is handled by main loop, not here)
      // This selector is called when we NEED a new process.
      return candidates.sort((a, b) => a.burstTime - b.burstTime || a.arrivalTime - b.arrivalTime)[0];

    case AlgorithmType.SRTF:
      return candidates.sort((a, b) => a.remainingTime - b.remainingTime || a.arrivalTime - b.arrivalTime)[0];

    case AlgorithmType.PRIORITY_NP:
      return candidates.sort((a, b) => a.priority - b.priority || a.arrivalTime - b.arrivalTime)[0];

    case AlgorithmType.PRIORITY_P:
      return candidates.sort((a, b) => a.priority - b.priority || a.arrivalTime - b.arrivalTime)[0];

    case AlgorithmType.HRRN:
      // Response Ratio = (W + S) / S = 1 + W/S
      return candidates.sort((a, b) => {
        const rrA = 1 + (currentTick - a.arrivalTime - (a.burstTime - a.remainingTime)) / a.burstTime;
        const rrB = 1 + (currentTick - b.arrivalTime - (b.burstTime - b.remainingTime)) / b.burstTime;
        return rrB - rrA; // Descending
      })[0];

    case AlgorithmType.EDF:
      // Earliest Deadline
      return candidates.sort((a, b) => (a.deadline || Infinity) - (b.deadline || Infinity) || a.arrivalTime - b.arrivalTime)[0];
      
    case AlgorithmType.RMS:
       // Rate Monotonic: Priority is inverse of period (Shorter period = Higher Priority/Lower Num)
       return candidates.sort((a, b) => (a.period || Infinity) - (b.period || Infinity) || a.arrivalTime - b.arrivalTime)[0];

    case AlgorithmType.RR:
      // For RR, selection depends on a queue that persists.
      // However, to keep this function pure-ish for the specialized "selector", we often rely on the `readyQueue` state passed in the main loop.
      // This function specifically helps if we just need a default sort, but RR is special.
      // We will handle RR selection primarily in the main tick engine using the ready queue.
      return candidates[0]; // Fallback

    default:
      return candidates[0];
  }
};

export const advanceSimulationTick = (
  prevTick: number,
  prevProcesses: Process[],
  config: SimulationConfig,
  prevReadyQueue: string[], // Array of PIDs
  prevRunningId: string | null,
  quantumClock: number // How long the current process has been running in this slice
): {
  processes: Process[];
  cpuId: string | null;
  readyQueue: string[];
  quantumClock: number;
} => {
  const currentTick = prevTick;
  let processes = prevProcesses.map(p => ({ ...p })); // Deep copy-ish
  let readyQueue = [...prevReadyQueue];
  let cpuId = prevRunningId;
  let nextQuantumClock = quantumClock;

  // 1. Identify newly arrived processes at this specific tick
  const newArrivals = processes
    .filter(p => p.arrivalTime === currentTick)
    .sort((a, b) => parseInt(a.id.slice(1)) - parseInt(b.id.slice(1))); // Tie break by ID

  // Add new arrivals to ready queue (if not already there)
  newArrivals.forEach(p => {
    if (!readyQueue.includes(p.id)) {
      readyQueue.push(p.id);
      p.state = ProcessState.READY;
    }
  });

  // 2. Determine who runs next
  // Strategy: Determine if we should preempt or context switch
  let candidates = processes.filter(p => p.state !== ProcessState.COMPLETED && p.arrivalTime <= currentTick);
  
  // Logic Branching based on Algorithm
  if (config.algorithm === AlgorithmType.RR) {
    // Round Robin Logic
    // If we have a running process
    if (cpuId) {
      const runningProc = processes.find(p => p.id === cpuId);
      
      // If it finished (will be handled by the update logic below? No, we need to know if we switch NOW)
      // Check if Quantum Expired
      if (runningProc && runningProc.remainingTime > 0 && quantumClock >= config.timeQuantum) {
         // Preempt: Move to back of queue
         readyQueue = readyQueue.filter(id => id !== cpuId); // Remove from front/current
         readyQueue.push(cpuId); // Add to back
         cpuId = null;
         nextQuantumClock = 0;
      }
    }
    
    // Pick next from queue
    if (!cpuId && readyQueue.length > 0) {
       // Filter readyQueue for actually available processes (sanity check)
       const validIds = readyQueue.filter(id => {
         const p = processes.find(proc => proc.id === id);
         return p && p.state !== ProcessState.COMPLETED;
       });

       if (validIds.length > 0) {
         cpuId = validIds[0];
         nextQuantumClock = 0;
       } else {
         cpuId = null;
       }
    }

  } else {
    // Standard Selection Logic (Preemptive vs Non-Preemptive)
    
    const isPreemptive = [AlgorithmType.SRTF, AlgorithmType.PRIORITY_P, AlgorithmType.EDF, AlgorithmType.RMS].includes(config.algorithm);
    
    // If Non-Preemptive and CPU is busy, do NOT switch (unless finished, handled later)
    // But here we are deciding for the *current* tick.
    // If a process was running in prev tick and is NOT complete, and we are NP, we stick with it.
    const runningProc = cpuId ? processes.find(p => p.id === cpuId) : null;
    
    if (!isPreemptive && runningProc && runningProc.remainingTime > 0) {
      // Continue running current
    } else {
      // Make a selection choice
      const potential = selectProcess(candidates.filter(p => p.state !== ProcessState.COMPLETED), config, currentTick, cpuId);
      
      if (potential) {
        // If we had a running process and it's different, that's a switch
        cpuId = potential.id;
      } else {
        cpuId = null;
      }
    }
  }

  // 3. Update States
  // Update waiting times for everyone in Ready Queue (Available but not running)
  processes.forEach(p => {
    if (p.state !== ProcessState.COMPLETED) {
      if (p.id === cpuId) {
        p.state = ProcessState.RUNNING;
        if (p.startTime === null) p.startTime = currentTick;
      } else if (p.arrivalTime <= currentTick) {
        p.state = ProcessState.READY;
        p.waitingTime++;
      } else {
        p.state = ProcessState.WAITING; // Future arrival
      }
    }
  });

  // 4. Run CPU
  if (cpuId) {
    const p = processes.find(proc => proc.id === cpuId);
    if (p) {
      p.remainingTime--;
      nextQuantumClock++;

      // Check Completion
      if (p.remainingTime <= 0) {
        p.remainingTime = 0;
        p.state = ProcessState.COMPLETED;
        p.completionTime = currentTick + 1; // It finishes AT the end of this tick
        p.turnaroundTime = p.completionTime - p.arrivalTime;
        // Waiting time is already accumulated incrementally above or calc as TAT - Burst
        // p.waitingTime = p.turnaroundTime - p.burstTime; // Verify calculation
        
        // Remove from Ready Queue
        readyQueue = readyQueue.filter(id => id !== cpuId);
        cpuId = null;
        nextQuantumClock = 0;
      }
    }
  }

  // Sync Ready Queue for visualization (Ordered list of waiting processes)
  // For non-RR, we usually just sort the available processes by the algo criteria
  if (config.algorithm !== AlgorithmType.RR) {
    const waiting = processes.filter(p => p.state === ProcessState.READY && p.id !== cpuId);
    // Sort these based on the algo to show who is "next"
    // We can reuse selectProcess logic or simplify
    let sortedWaiting: Process[] = [];
    // Bubble sort or basic sort for display
    const tempQ = [...waiting];
    
    // Sort logic mimics the selection logic
    if (config.algorithm === AlgorithmType.FCFS) {
      tempQ.sort((a, b) => a.arrivalTime - b.arrivalTime);
    } else if (config.algorithm === AlgorithmType.SJF || config.algorithm === AlgorithmType.SRTF) {
      tempQ.sort((a, b) => a.remainingTime - b.remainingTime); // Approximate for SJF too
    } else if (config.algorithm.includes('PRIORITY') || config.algorithm === AlgorithmType.RMS) {
       const key = config.algorithm === AlgorithmType.RMS ? 'period' : 'priority';
       // @ts-ignore
       tempQ.sort((a, b) => (a[key] || 0) - (b[key] || 0));
    } else if (config.algorithm === AlgorithmType.EDF) {
       tempQ.sort((a, b) => (a.deadline || 999) - (b.deadline || 999));
    }
    
    readyQueue = tempQ.map(p => p.id);
  }

  return {
    processes,
    cpuId,
    readyQueue,
    quantumClock: nextQuantumClock
  };
};