import { Component, inject, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApexStateService } from '../services/apex-state.service';
import { SpeechRecognitionService } from '../services/speech-recognition.service';

@Component({
  selector: '[app-control-panel]',
  standalone: true,
  imports: [CommonModule, FormsModule],
  encapsulation: ViewEncapsulation.None,
  template: `
    <div class="input-container">
      <textarea
        [(ngModel)]="promptText"
        (keydown.enter)="$event.preventDefault(); sendPrompt()"
        placeholder="ENTER COGNITIVE DIRECTIVE (PRESS ENTER TO TRANSMIT)..."
        class="hud-textarea">
      </textarea>
      <div class="button-group">
        <button *ngIf="isSpeechSupported" (click)="toggleSpeech()" [class.active]="state() === 'LISTENING'" class="hud-button speech-button" type="button">
          <svg viewBox="0 0 24 24" class="btn-icon"><path fill="currentColor" d="M12,2A3,3 0 0,1 15,5V11A3,3 0 0,1 12,14A3,3 0 0,1 9,11V5A3,3 0 0,1 12,2M19,11C19,14.53 16.39,17.44 13,17.93V21H11V17.93C7.61,17.44 5,14.53 5,11H7A5,5 0 0,0 12,16A5,5 0 0,0 17,11H19Z"/></svg>
          <span>{{ state() === 'LISTENING' ? 'VOX_ON (STOP)' : 'ACTIVATE VOX' }}</span>
        </button>
        <button (click)="sendPrompt()" [disabled]="!promptText.trim()" class="hud-button submit-button" type="button">
          <svg viewBox="0 0 24 24" class="btn-icon"><path fill="currentColor" d="M2,21L23,12L2,3V10L17,12L2,14V21Z" /></svg>
          <span>TRANSMIT DIRECTIVE</span>
        </button>
      </div>
    </div>
  `,
})
export class ControlPanelComponent {
  private readonly stateService = inject(ApexStateService);
  private readonly speechService = inject(SpeechRecognitionService);

  public promptText = '';
  public readonly state = this.stateService.state;
  public readonly isSpeechSupported = this.speechService.isSupported();

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
}
