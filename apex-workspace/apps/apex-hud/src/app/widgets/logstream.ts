import { Component, inject, ViewChild, ElementRef, AfterViewChecked, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApexStateService } from '../services/apex-state.service';

@Component({
  selector: '[app-logstream]',
  standalone: true,
  imports: [CommonModule],
  encapsulation: ViewEncapsulation.None,
  template: `
    <div class="widget-header">
      <span class="widget-title">COGNITIVE_LOGSTREAM</span>
      <span class="widget-subtitle">LIVE AI COGNITION STREAM</span>
    </div>

    <div class="widget-body console-body" #responseContainer>
      <div class="console-overlay"></div>
      <div class="console-scroll-wrapper">
        <div class="console-lines" *ngIf="currentResponse(); else emptyPrompt">
          <div class="console-metadata">
            <span class="tag-secure">SECURE_LINK</span>
            <span class="time-stamp">NODE_OK</span>
          </div>
          <p class="console-text">{{ currentResponse() }}<span class="console-cursor">█</span></p>
        </div>

        <ng-template #emptyPrompt>
          <div class="console-empty">
            <div class="glitch-text">AWAITING DIRECTIVE</div>
            <div class="sub-empty">ESTABLISH INPUT OR ENABLE VOX SYSTEM...</div>
            <div class="tech-stats">
              <div>HOST: LOCAL_NODE_01</div>
              <div>MODEL: OLLAMA_LLM_HOST</div>
              <div>PROTO: WEBSOCKET_SECURE</div>
            </div>
          </div>
        </ng-template>
      </div>
    </div>
  `,
})
export class LogstreamComponent implements AfterViewChecked {
  private readonly stateService = inject(ApexStateService);

  @ViewChild('responseContainer') private responseContainer!: ElementRef;

  public readonly currentResponse = this.stateService.currentResponse;

  ngAfterViewChecked() {
    this.scrollToBottom();
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
