import { Injectable, signal, inject } from '@angular/core';
import { ApexState, ApexStreamChunk, SystemMetrics } from '@apex-workspace/shared-interfaces';
import { ApexWebSocketService } from './apex-websocket.service';

@Injectable({
  providedIn: 'root',
})
export class ApexStateService {
  private readonly wsService = inject(ApexWebSocketService);

  // Writable signals for internal state management
  private readonly _state = signal<ApexState>('IDLE');
  private readonly _currentResponse = signal<string>('');
  private readonly _systemMetrics = signal<SystemMetrics>({ cpu: 0, ram: 0 });

  // Read-only signals exposed to components
  public readonly state = this._state.asReadonly();
  public readonly currentResponse = this._currentResponse.asReadonly();
  public readonly systemMetrics = this._systemMetrics.asReadonly();

  constructor() {
    this.initializeWebSocketListeners();
  }

  /**
   * Directly set the state and notify the backend.
   */
  setState(newState: ApexState): void {
    this._state.set(newState);
    this.wsService.sendStateChange(newState);
  }

  /**
   * Send a text prompt to the backend, transition state to THINKING, and clear previous response.
   */
  sendPrompt(prompt: string): void {
    this._currentResponse.set('');
    this._state.set('THINKING');
    this.wsService.sendPrompt(prompt);
  }

  /**
   * Listen to incoming backend events from the WebSocket service.
   */
  private initializeWebSocketListeners(): void {
    // Listen to CPU and RAM metrics
    this.wsService.getSystemMetrics().subscribe({
      next: (metrics) => {
        this._systemMetrics.set(metrics);
      },
      error: (err) => {
        console.error('StateService: Error receiving system metrics', err);
      },
    });

    // Listen to AI response chunks
    this.wsService.getAiStream().subscribe({
      next: (chunk: ApexStreamChunk) => {
        if (chunk.content) {
          this._currentResponse.update((current) => current + chunk.content);
        }
        if (chunk.state) {
          this._state.set(chunk.state);
        }
      },
      error: (err) => {
        console.error('StateService: Error in AI stream', err);
        this._state.set('IDLE');
      },
    });

    // Listen to stream errors
    this.wsService.getStreamError().subscribe({
      next: (err) => {
        console.error('StateService: Received stream error from backend:', err.error);
        this._state.set('IDLE');
      },
    });
  }
}
