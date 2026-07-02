export type ApexState = 'IDLE' | 'THINKING' | 'LISTENING';

export interface ApexStreamChunk {
  content: string;
  done: boolean;
  state?: ApexState;
}

export interface SystemMetrics {
  cpu: number;
  ram: number;
  cpuSpeed?: number;
  cpuTemp?: number;
  cpuLoadAvg?: number;
  ramTotal?: number;
  ramUsed?: number;
}

