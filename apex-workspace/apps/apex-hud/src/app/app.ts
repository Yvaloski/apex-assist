import { Component, inject, signal, computed, ViewChild, ElementRef, AfterViewChecked } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApexStateService } from './services/apex-state.service';
import { SpeechRecognitionService } from './services/speech-recognition.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App implements AfterViewChecked {
  private readonly stateService = inject(ApexStateService);
  private readonly speechService = inject(SpeechRecognitionService);

  @ViewChild('responseContainer') private responseContainer!: ElementRef;

  // Title for tests and identification
  public readonly title = 'apex-hud';

  // Bind signals from global state
  public readonly state = this.stateService.state;
  public readonly currentResponse = this.stateService.currentResponse;
  public readonly systemMetrics = this.stateService.systemMetrics;

  // Local UI state
  public promptText = '';
  public readonly isSpeechSupported = this.speechService.isSupported();

  // Computed state class for dynamic color themes
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
        this.responseContainer.nativeElement.scrollTop = this.responseContainer.nativeElement.scrollHeight;
      }
    } catch (err) {
      // Ignore
    }
  }
}

