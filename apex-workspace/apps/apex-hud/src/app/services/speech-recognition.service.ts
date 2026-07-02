import { Injectable, inject, NgZone } from '@angular/core';
import { ApexStateService } from './apex-state.service';

@Injectable({
  providedIn: 'root',
})
export class SpeechRecognitionService {
  private readonly stateService = inject(ApexStateService);
  private readonly ngZone = inject(NgZone);
  private recognition: any;
  private isListening = false;

  constructor() {
    if (typeof window !== 'undefined') {
      this.initSpeechRecognition();
    }
  }

  /**
   * Returns true if Speech Recognition is supported in the current browser.
   */
  public isSupported(): boolean {
    if (typeof window === 'undefined') {
      return false;
    }
    const { SpeechRecognition, webkitSpeechRecognition } = window as any;
    return !!(SpeechRecognition || webkitSpeechRecognition);
  }

  /**
   * Start capturing voice input.
   */
  public start(): void {
    if (this.isListening) {
      return;
    }

    if (!this.recognition && typeof window !== 'undefined') {
      this.initSpeechRecognition();
    }

    if (!this.recognition) {
      console.warn('SpeechRecognitionService: Speech recognition not supported in this browser.');
      return;
    }

    try {
      this.isListening = true;
      this.stateService.setState('LISTENING');
      this.recognition.start();
    } catch (err) {
      console.error('SpeechRecognitionService: Failed to start recognition', err);
      this.isListening = false;
      this.stateService.setState('IDLE');
    }
  }

  /**
   * Stop capturing voice input.
   */
  public stop(): void {
    if (!this.isListening) {
      return;
    }

    if (this.recognition) {
      try {
        this.recognition.stop();
      } catch (err) {
        console.error('SpeechRecognitionService: Failed to stop recognition', err);
      }
    }
    this.isListening = false;
  }

  /**
   * Initialize speech recognition and bind event handlers.
   */
  private initSpeechRecognition(): void {
    const { SpeechRecognition, webkitSpeechRecognition } = window as any;
    const SpeechRecognitionClass = SpeechRecognition || webkitSpeechRecognition;

    if (!SpeechRecognitionClass) {
      return;
    }

    const recognition = new SpeechRecognitionClass();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'fr-FR';

    recognition.onresult = (event: any) => {
      this.ngZone.run(() => {
        const transcript = event.results[0][0]?.transcript;
        if (transcript && transcript.trim()) {
          console.log('SpeechRecognitionService: Speech recognized:', transcript);
          this.stateService.setResponse(`[VOICE_INPUT_RECOGNIZED] "${transcript}"\n[CORE_LINK] TRANSMITTING DIRECTIVE...`);
          this.stateService.sendPrompt(transcript);
        }
      });
    };

    recognition.onerror = (event: any) => {
      this.ngZone.run(() => {
        console.error('SpeechRecognitionService: Recognition error', event.error);
        this.isListening = false;
        this.stateService.setState('IDLE');

        let errorMsg = `[SYSTEM_WARNING] VOICE_INPUT_FAILED: ${event.error.toUpperCase()}`;
        if (event.error === 'service-not-allowed') {
          errorMsg += `\n\n-> Reason: Google Speech API is unavailable in this Electron build (standard Chromium restriction).`;
          errorMsg += `\n-> Action: Please open the HUD in Google Chrome at http://localhost:4200/ for Web Speech support.`;
        } else if (event.error === 'not-allowed') {
          errorMsg += `\n\n-> Reason: Microphone access denied.`;
          errorMsg += `\n-> Action: Check Windows microphone permissions for Electron/terminal.`;
        } else {
          errorMsg += `\n\n-> Please check browser/system speech settings.`;
        }
        this.stateService.setResponse(errorMsg);
      });
    };

    recognition.onend = () => {
      this.ngZone.run(() => {
        this.isListening = false;
        // If recognition ended naturally but state is still LISTENING (e.g. user remained silent)
        if (this.stateService.state() === 'LISTENING') {
          this.stateService.setState('IDLE');
        }
      });
    };

    this.recognition = recognition;
  }
}
