import { Component, inject, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApexStateService } from '../services/apex-state.service';
import { SpeechRecognitionService } from '../services/speech-recognition.service';
import { TextToSpeechService } from '../services/text-to-speech.service';

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
        <button (click)="toggleMute()" [class.active]="isMuted()" class="hud-button mute-button" type="button">
          <svg viewBox="0 0 24 24" class="btn-icon">
            <path *ngIf="!isMuted()" fill="currentColor" d="M14,3.23V5.29C16.89,6.15 19,8.83 19,12C19,15.17 16.89,17.85 14,18.71V20.77C18,19.86 21,16.28 21,12C21,7.72 18,4.14 14,3.23M16.5,12C16.5,10.23 15.5,8.71 14,7.97V16C15.5,15.29 16.5,13.77 16.5,12M3,9V15H7L12,20V4L7,9H3Z"/>
            <path *ngIf="isMuted()" fill="currentColor" d="M12,4L9.91,6.09L12,8.18M4.27,3L3,4.27L7.73,9H3V15H7L12,20V13.27L16.25,17.53C15.58,18.04 14.83,18.46 14,18.7V20.77C15.38,20.44 16.63,19.78 17.68,18.95L20.73,22L22,20.73M19,12C19,12.78 18.87,13.53 18.64,14.24L20.2,15.8C20.72,14.64 21,13.35 21,12C21,7.72 18,4.14 14,3.23V5.29C16.89,6.15 19,8.83 19,12M16.5,12C16.5,11.5 16.38,11.03 16.16,10.61L17.75,12.2M14,7.97L14.73,8.7L14,7.97Z"/>
          </svg>
          <span>{{ isMuted() ? 'VOICE_MUTED' : 'MUTE_VOICE' }}</span>
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
  private readonly ttsService = inject(TextToSpeechService);

  public promptText = '';
  public readonly state = this.stateService.state;
  public readonly isSpeechSupported = this.speechService.isSupported();
  public readonly isMuted = this.ttsService.isMuted;

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

  public toggleMute(): void {
    this.ttsService.toggleMute();
  }
}
