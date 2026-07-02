import {
  Component,
  inject,
  signal,
  computed,
  ViewChild,
  ElementRef,
  AfterViewChecked,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApexStateService } from './services/apex-state.service';
import { SpeechRecognitionService } from './services/speech-recognition.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App implements AfterViewChecked {
  private readonly stateService = inject(ApexStateService);
  private readonly speechService = inject(SpeechRecognitionService);

  @ViewChild('responseContainer') private responseContainer!: ElementRef;

  public readonly title = 'apex-hud';

  // Tes vrais signaux d'origine issus du service global
  public readonly state = this.stateService.state;
  public readonly currentResponse = this.stateService.currentResponse;
  public readonly systemMetrics = this.stateService.systemMetrics;

  // 🟢 NOUVEAU : Signal réseau dynamique lié à l'état global ou à ton futur service
  // Si ton ApexStateService possède déjà un signal networkMetrics, remplace par : this.stateService.networkMetrics
  public readonly networkMetrics = computed(() => {
    const s = this.state();
    return {
      nodeAddr: '127.0.0.1:4200',
      wsLatency: s === 'THINKING' ? 14 : 4,
      bufferStatus: s === 'THINKING' ? 'PROCESSING' : 'NOMINAL',
      packetLoss: 0.0,
    };
  });

  public promptText = '';
  public readonly isSpeechSupported = this.speechService.isSupported();

  public readonly stateClass = computed(() => {
    const s = this.state();
    return s.toLowerCase();
  });

  public readonly stateLabel = computed(() => {
    const s = this.state();
    switch (s) {
      case 'THINKING':
        return 'PROCESSING QUERY...';
      case 'LISTENING':
        return 'CAPTURING AUDIO...';
      default:
        return 'SYSTEM ONLINE';
    }
  });

  ngAfterViewChecked() {
    this.scrollToBottom();
  }

  public sendPrompt(): void {
    const text = this.promptText.trim();
    if (!text) return;
    this.stateService.sendPrompt(text);
    this.promptText = '';
  }

  public toggleSpeech(): void {
    if (this.state() === 'LISTENING') {
      this.speechService.stop();
      this.stateService.setState('IDLE');
    } else {
      this.speechService.start();
    }
  }

  private scrollToBottom(): void {
    try {
      if (this.responseContainer) {
        this.responseContainer.nativeElement.scrollTop =
          this.responseContainer.nativeElement.scrollHeight;
      }
    } catch (err) {
      // Ignore
    }
  }
}
