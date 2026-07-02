import {
  Component,
  signal,
  ViewChild,
  ElementRef,
  effect,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApexState } from '@apex-workspace/shared-interfaces';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './app.html',
  styleUrls: ['./app.scss'],
})
export class AppComponent {
  @ViewChild('responseContainer')
  responseContainer!: ElementRef<HTMLDivElement>;

  state = signal<ApexState>('IDLE');
  promptText = '';
  currentResponse = signal<string>('');
  systemMetrics = signal({ cpu: 14.5, ram: 62.8 });
  isSpeechSupported = true;

  constructor() {
    effect(() => {
      if (this.currentResponse() && this.responseContainer) {
        setTimeout(() => {
          const container = this.responseContainer.nativeElement;
          container.scrollTop = container.scrollHeight;
        }, 0);
      }
    });
  }

  stateLabel(): string {
    switch (this.state()) {
      case 'LISTENING':
        return 'VOX_ACTIVE_LISTENING';
      case 'THINKING':
        return 'COGNITIVE_PROCESSING';

      case 'IDLE':
      default:
        return 'SYSTEM_READY_AWAITING_INPUT';
    }
  }

  stateClass(): string {
    return `state-${this.state().toLowerCase()}`;
  }

  sendPrompt() {
    if (!this.promptText.trim()) return;
    this.state.set('THINKING');
    this.currentResponse.set(
      `[CORE_LINK] TRANSMITTING DIRECTIVE...\n[APEX] COGNITIVE ENGINE ENGAGED.`,
    );
    this.promptText = '';

    setTimeout(() => {
      this.state.set('IDLE');
    }, 4000);
  }

  toggleSpeech() {
    this.state.set(this.state() === 'LISTENING' ? 'IDLE' : 'LISTENING');
  }
}
