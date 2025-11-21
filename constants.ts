import { AlgorithmType } from './types';

export const ALGORITHMS: { value: AlgorithmType; label: string; description: string }[] = [
  { value: AlgorithmType.FCFS, label: 'First-Come, First-Served', description: 'Simple queue based on arrival time.' },
  { value: AlgorithmType.SJF, label: 'Shortest Job First (Non-Preemptive)', description: 'Selects process with smallest burst time.' },
  { value: AlgorithmType.SRTF, label: 'Shortest Remaining Time First', description: 'Preemptive version of SJF.' },
  { value: AlgorithmType.RR, label: 'Round Robin', description: 'Fixed time quantum cycler.' },
  { value: AlgorithmType.PRIORITY_NP, label: 'Priority (Non-Preemptive)', description: 'Highest priority runs to completion.' },
  { value: AlgorithmType.PRIORITY_P, label: 'Priority (Preemptive)', description: 'Highest priority interrupts running process.' },
  { value: AlgorithmType.HRRN, label: 'Highest Response Ratio Next', description: 'Dynamic priority based on waiting time.' },
  { value: AlgorithmType.EDF, label: 'Earliest Deadline First', description: 'Dynamic priority based on closest deadline.' },
  { value: AlgorithmType.RMS, label: 'Rate Monotonic Scheduling', description: 'Static priority based on period duration.' },
];

export const PROCESS_COLORS = [
  '#3b82f6', // blue-500
  '#ef4444', // red-500
  '#10b981', // emerald-500
  '#f59e0b', // amber-500
  '#8b5cf6', // violet-500
  '#ec4899', // pink-500
  '#06b6d4', // cyan-500
  '#f97316', // orange-500
  '#84cc16', // lime-500
  '#d946ef', // fuchsia-500
];

export const INITIAL_PROCESSES = [
  { id: 'P1', arrivalTime: 0, burstTime: 5, priority: 2, deadline: 10, period: 10 },
  { id: 'P2', arrivalTime: 1, burstTime: 3, priority: 1, deadline: 5, period: 5 },
  { id: 'P3', arrivalTime: 2, burstTime: 8, priority: 3, deadline: 20, period: 20 },
  { id: 'P4', arrivalTime: 3, burstTime: 6, priority: 4, deadline: 15, period: 15 },
];