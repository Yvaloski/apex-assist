import { Injectable, signal, inject } from '@angular/core';
import { ApexState, ApexStreamChunk, SystemMetrics } from '@apex-workspace/shared-interfaces';
import { ApexWebSocketService } from './apex-websocket.service';
import { AudioSynthesisService } from './audio-synthesis.service';
import { TextToSpeechService } from './text-to-speech.service';

@Injectable({
  providedIn: 'root',
})
export class ApexStateService {
  private readonly wsService = inject(ApexWebSocketService);
  private readonly audioService = inject(AudioSynthesisService);
  private readonly ttsService = inject(TextToSpeechService);

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
    const previousState = this._state();
    this._state.set(newState);
    this.wsService.sendStateChange(newState);
    this.handleStateChangeEffects(previousState, newState);
  }

  /**
   * Send a text prompt to the backend, transition state to THINKING, and clear previous response.
   */
  sendPrompt(prompt: string): void {
    const previousState = this._state();
    this._currentResponse.set('');
    this._state.set('THINKING');
    this.wsService.sendPrompt(prompt);
    this.handleStateChangeEffects(previousState, 'THINKING');
  }

  /**
   * Set a custom response message in the HUD logstream.
   */
  setResponse(response: string): void {
    this._currentResponse.set(response);
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
          this.ttsService.feedChunk(chunk.content);
        }

        let isStreamDone = false;
        if (chunk.done) {
          this.ttsService.flush();
          isStreamDone = true;
        }

        if (chunk.state) {
          const previousState = this._state();
          const newState = chunk.state;
          this._state.set(newState);
          this.handleStateChangeEffects(previousState, newState, isStreamDone);
        } else if (isStreamDone) {
          this.audioService.playConfirmChime();
        }
      },
      error: (err) => {
        console.error('StateService: Error in AI stream', err);
        const previousState = this._state();
        this._state.set('IDLE');
        this.handleStateChangeEffects(previousState, 'IDLE');
      },
    });

    // Listen to stream errors
    this.wsService.getStreamError().subscribe({
      next: (err) => {
        console.error('StateService: Received stream error from backend:', err.error);
        const previousState = this._state();
        this._state.set('IDLE');
        this.handleStateChangeEffects(previousState, 'IDLE');
      },
    });
  }

  /**
   * Play state transition sounds and manage text-to-speech lifecycle.
   */
  private handleStateChangeEffects(previousState: ApexState, newState: ApexState, isStreamDone = false): void {
    if (previousState === newState) {
      if (newState === 'IDLE' && isStreamDone) {
        this.audioService.playConfirmChime();
      }
      return;
    }

    if (newState === 'LISTENING') {
      this.ttsService.cancel();
      this.audioService.playListeningChirp();
    } else if (newState === 'THINKING') {
      this.ttsService.cancel();
      this.audioService.playThinkingTone();
    } else if (newState === 'IDLE') {
      this.audioService.playConfirmChime();
    }
  }
}

