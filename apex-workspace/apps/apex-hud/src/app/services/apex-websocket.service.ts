import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { io, Socket } from 'socket.io-client';
import { ApexState, ApexStreamChunk, SystemMetrics } from '@apex-workspace/shared-interfaces';

@Injectable({
  providedIn: 'root',
})
export class ApexWebSocketService {
  private socket: Socket;

  constructor() {
    // Connect to the NestJS gateway at http://localhost:3000 (default namespace /)
    this.socket = io('http://localhost:3000');
  }

  /**
   * Listen to system metrics updates from the backend.
   */
  getSystemMetrics(): Observable<SystemMetrics> {
    return new Observable<SystemMetrics>((observer) => {
      this.socket.on('system-metrics', (data: SystemMetrics) => {
        observer.next(data);
      });
      return () => {
        this.socket.off('system-metrics');
      };
    });
  }

  /**
   * Listen to streamed AI response chunks.
   */
  getAiStream(): Observable<ApexStreamChunk> {
    return new Observable<ApexStreamChunk>((observer) => {
      this.socket.on('ai-stream', (data: ApexStreamChunk) => {
        observer.next(data);
      });
      return () => {
        this.socket.off('ai-stream');
      };
    });
  }

  /**
   * Listen to stream error events.
   */
  getStreamError(): Observable<{ error: string }> {
    return new Observable<{ error: string }>((observer) => {
      this.socket.on('stream-error', (data: { error: string }) => {
        observer.next(data);
      });
      return () => {
        this.socket.off('stream-error');
      };
    });
  }

  /**
   * Send a text prompt to the backend.
   */
  sendPrompt(prompt: string): void {
    this.socket.emit('prompt', { prompt });
  }

  /**
   * Send state changes to the backend.
   */
  sendStateChange(state: ApexState): void {
    this.socket.emit('state-change', { state });
  }

  /**
   * Disconnect the socket connection.
   */
  disconnect(): void {
    this.socket.disconnect();
  }
}
