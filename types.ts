export enum ProcessState {
  READY = 'READY',
  RUNNING = 'RUNNING',
  COMPLETED = 'COMPLETED',
  WAITING = 'WAITING',
}

export interface Process {
  id: string;
  arrivalTime: number;
  burstTime: number;
  priority: number; // Lower number = Higher priority
  deadline?: number; // For EDF
  period?: number; // For RMS
  
  // Dynamic State during simulation
  remainingTime: number;
  state: ProcessState;
  startTime: number | null;
  completionTime: number | null;
  waitingTime: number;
  turnaroundTime: number;
  color: string; // Hex color for visualization
  
  // MLFQ specific
  currentQueueLevel?: number;
  timeInCurrentQueue?: number;
}

export enum AlgorithmType {
  FCFS = 'FCFS',
  SJF = 'SJF', // Non-preemptive
  SRTF = 'SRTF', // Preemptive SJF
  RR = 'RR',
  PRIORITY_NP = 'PRIORITY_NP',
  PRIORITY_P = 'PRIORITY_P',
  HRRN = 'HRRN',
  EDF = 'EDF', // Earliest Deadline First
  RMS = 'RMS', // Rate Monotonic
}

export interface GanttBlock {
  processId: string | 'IDLE';
  startTime: number;
  endTime: number;
  color: string;
}

export interface SimulationState {
  tick: number;
  processes: Process[];
  ganttLog: GanttBlock[];
  cpuId: string | null; // Currently running PID
  isFinished: boolean;
  readyQueue: string[]; // List of PIDs in order
}

export interface SimulationConfig {
  algorithm: AlgorithmType;
  timeQuantum: number; // For RR
  contextSwitchOverhead: number; // Future proofing
}