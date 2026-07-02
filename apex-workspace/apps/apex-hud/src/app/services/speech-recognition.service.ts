import { Injectable, inject, NgZone } from '@angular/core';
import { ApexStateService } from './apex-state.service';

export interface VoiceDiagnosticReport {
  supported: boolean;
  isElectron: boolean;
  permission: string;
  deviceCount: number;
  streamOk: boolean;
  streamError: string | null;
  isSilent: boolean;
  volumeLevel: number;
  recommendations: string[];
}

@Injectable({
  providedIn: 'root',
})
export class SpeechRecognitionService {
  private readonly stateService = inject(ApexStateService);
  private readonly ngZone = inject(NgZone);
  private recognition: any;
  private isListening = false;
  private currentLang = 'fr-FR';

  constructor() {
    if (typeof window !== 'undefined') {
      const browserLang = navigator.language || (navigator as any).userLanguage || '';
      this.currentLang = browserLang.startsWith('fr') ? 'fr-FR' : 'en-US';
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
   * Set speech recognition language (e.g. 'fr-FR' or 'en-US').
   */
  public setLanguage(lang: string): void {
    this.currentLang = lang;
    if (this.recognition) {
      this.recognition.lang = lang;
    }
  }

  /**
   * Get current speech recognition language.
   */
  public getLanguage(): string {
    return this.currentLang;
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
      this.triggerDiagnosticsReport('service-not-supported');
      return;
    }

    try {
      this.isListening = true;
      this.stateService.setState('LISTENING');
      this.stateService.setResponse('[VOICE_SYSTEM] INITIALIZING MICROPHONE CAPTURE...');
      this.recognition.start();
    } catch (err: any) {
      console.error('SpeechRecognitionService: Failed to start recognition', err);
      this.isListening = false;
      this.stateService.setState('IDLE');
      this.triggerDiagnosticsReport(err.name || 'start-failed');
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
   * Run a complete diagnostic check on speech recognition, browser context, and microphone hardware.
   */
  public async runDiagnostics(): Promise<VoiceDiagnosticReport> {
    const isSupported = this.isSupported();
    const isElectron = typeof window !== 'undefined' && 
      (!!(window as any).process?.versions?.electron || navigator.userAgent.toLowerCase().includes('electron'));

    let permission = 'unknown';
    if (typeof window !== 'undefined' && navigator.permissions && typeof navigator.permissions.query === 'function') {
      try {
        const status = await navigator.permissions.query({ name: 'microphone' as any });
        permission = status.state;
      } catch (e) {
        permission = 'query-failed';
      }
    }

    let deviceCount = 0;
    if (typeof window !== 'undefined' && navigator.mediaDevices && typeof navigator.mediaDevices.enumerateDevices === 'function') {
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        deviceCount = devices.filter(d => d.kind === 'audioinput').length;
      } catch (e) {
        console.warn('SpeechRecognitionService: Failed to enumerate devices', e);
      }
    }

    let streamOk = false;
    let streamError: string | null = null;
    let isSilent = true;
    let volumeLevel = 0;

    if (typeof window !== 'undefined' && navigator.mediaDevices && typeof navigator.mediaDevices.getUserMedia === 'function') {
      let stream: MediaStream | null = null;
      let audioCtx: AudioContext | null = null;
      try {
        stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        streamOk = true;

        // Perform silence test using Web Audio API
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioContextClass) {
          audioCtx = new AudioContextClass();
          const source = audioCtx.createMediaStreamSource(stream);
          const analyser = audioCtx.createAnalyser();
          analyser.fftSize = 256;
          source.connect(analyser);

          const bufferLength = analyser.frequencyBinCount;
          const dataArray = new Uint8Array(bufferLength);
          
          // Let audio stream settle and capture buffer
          await new Promise(resolve => setTimeout(resolve, 300));
          analyser.getByteFrequencyData(dataArray);

          let sum = 0;
          for (let i = 0; i < bufferLength; i++) {
            sum += dataArray[i];
          }
          volumeLevel = sum / bufferLength;
          // Normal background noise will produce volumeLevel > 0.
          // Totally silent stream will have volumeLevel close to or equal to 0.
          if (volumeLevel > 1) {
            isSilent = false;
          }
        }
      } catch (err: any) {
        streamOk = false;
        streamError = err.name || err.message || String(err);
      } finally {
        if (audioCtx) {
          try {
            await audioCtx.close();
          } catch (e) {}
        }
        if (stream) {
          stream.getTracks().forEach(track => track.stop());
        }
      }
    } else {
      streamError = 'navigator.mediaDevices.getUserMedia not supported or insecure context';
    }

    // Build recommendations
    const recommendations: string[] = [];
    if (!isSupported) {
      recommendations.push('Speech Recognition is NOT supported in this client. Please use Google Chrome or Microsoft Edge.');
    }
    if (isElectron) {
      recommendations.push('Electron builds block Google Speech API by default. Open the app in Google Chrome at http://localhost:4200/ for full microphone capabilities.');
    }
    if (permission === 'denied') {
      recommendations.push('Microphone access is explicitly BLOCKED in your system/browser settings. Re-enable it via browser address bar or OS Privacy settings.');
    }
    if (deviceCount === 0) {
      recommendations.push('No physical audio input devices (microphones) were found. Connect a headset or external microphone.');
    }
    if (streamError) {
      if (streamError.includes('NotAllowedError') || streamError.includes('PermissionDeniedError')) {
        recommendations.push('Microphone access was denied. Ensure browser has permission and click "Allow" on the permission prompt.');
      } else if (streamError.includes('NotFoundError') || streamError.includes('DevicesNotFoundError')) {
        recommendations.push('Microphone hardware could not be found. Check your hardware connection.');
      } else if (streamError.includes('NotReadableError') || streamError.includes('TrackStartError')) {
        recommendations.push('Microphone is busy/blocked. Close other apps (e.g. Teams, Discord, Zoom) that might be using the microphone exclusively.');
      } else if (streamError.includes('insecure context')) {
        recommendations.push('Web Speech API requires a secure context. Access the app via https:// or localhost.');
      }
    } else if (isSilent) {
      recommendations.push('Microphone is connected but silent (0% signal). Check your headset physical mute button or OS input level slider.');
    }

    return {
      supported: isSupported,
      isElectron,
      permission,
      deviceCount,
      streamOk,
      streamError,
      isSilent,
      volumeLevel,
      recommendations
    };
  }

  /**
   * Print a detailed diagnostic report in the HUD console.
   */
  private async triggerDiagnosticsReport(errorName: string): Promise<void> {
    this.stateService.setResponse(`[SYSTEM_WARNING] VOICE_INPUT_FAILED: ${errorName.toUpperCase()}\n[DIAGNOSTICS] INITIATING MICROPHONE HARDWARE PROBE...`);
    
    try {
      const report = await this.runDiagnostics();
      
      let reportStr = `[SYSTEM_WARNING] VOICE_INPUT_FAILED: ${errorName.toUpperCase()}\n\n`;
      reportStr += `┌─── APEX VOICE DIAGNOSTICS ────────────────────────┐\n`;
      reportStr += `│ API SUPPORTED : ${report.supported ? 'YES (WEBKIT)' : 'NO'}  \n`;
      reportStr += `│ CONTEXT       : ${report.isElectron ? 'ELECTRON DESKTOP' : 'WEB BROWSER'}  \n`;
      reportStr += `│ PERM STATE    : ${report.permission.toUpperCase()}  \n`;
      reportStr += `│ MIC COUNT     : ${report.deviceCount} DEVICE(S) DETECTED  \n`;
      
      if (report.streamOk) {
        reportStr += `│ HARDWARE TEST : OK  \n`;
        reportStr += `│ SIGNAL LEVEL  : ${report.isSilent ? 'SILENT (0%)' : `ACTIVE (${Math.round(report.volumeLevel)}%)`}  \n`;
      } else {
        reportStr += `│ HARDWARE TEST : FAILED  \n`;
        reportStr += `│ ERROR CODE    : ${report.streamError || 'UNKNOWN'}  \n`;
      }
      reportStr += `└───────────────────────────────────────────────────┘\n\n`;

      if (report.recommendations.length > 0) {
        reportStr += `RECOMMENDED ACTIONS:\n`;
        report.recommendations.forEach((rec, idx) => {
          reportStr += ` ${idx + 1}. ${rec}\n`;
        });
      } else {
        reportStr += `SYSTEM STATUS: Microphone is healthy and responsive. Ensure you speak clearly when VOX is active.\n`;
      }
      
      this.stateService.setResponse(reportStr);
    } catch (err) {
      console.error('SpeechRecognitionService: Diagnostics failed', err);
      this.stateService.setResponse(`[SYSTEM_WARNING] VOICE_INPUT_FAILED: ${errorName.toUpperCase()}\n-> System diagnostics failed to complete.`);
    }
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
    recognition.lang = this.currentLang;

    recognition.onstart = () => {
      this.ngZone.run(() => {
        console.log('SpeechRecognitionService: Recognition session started');
        this.stateService.setResponse('[VOICE_SYSTEM] MIC ACTIVE. LISTENING FOR DIRECTIVE...');
      });
    };

    recognition.onspeechstart = () => {
      this.ngZone.run(() => {
        console.log('SpeechRecognitionService: Speech started');
        this.stateService.setResponse('[VOICE_SYSTEM] DETECTING AUDIO INPUT...');
      });
    };

    recognition.onspeechend = () => {
      this.ngZone.run(() => {
        console.log('SpeechRecognitionService: Speech ended');
        this.stateService.setResponse('[VOICE_SYSTEM] SPEECH INPUT CONCLUDED. PROCESSING...');
      });
    };

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

        // Trigger asynchronous diagnostics report
        this.triggerDiagnosticsReport(event.error);
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
