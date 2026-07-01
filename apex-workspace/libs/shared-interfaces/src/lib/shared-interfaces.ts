export type ApexState = 'IDLE' | 'THINKING' | 'LISTENING';

export interface ApexStreamChunk {
  content: string;
  done: boolean;
  state?: ApexState;
}
