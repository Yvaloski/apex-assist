import { Component, inject, computed, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApexStateService } from '../services/apex-state.service';

@Component({
  selector: '[app-hud-header]',
  standalone: true,
  imports: [CommonModule],
  encapsulation: ViewEncapsulation.None,
  template: `
    <div class="header-left">
      <div class="logo-box">
        <span class="logo-symbol">▲</span>
        <h1 class="hud-main-title">APEX // DIGITAL_HUD</h1>
      </div>
      <div class="network-badge">
        <span class="pulse-dot"></span>
        <span class="badge-text">CORE_WS: ESTABLISHED</span>
      </div>
    </div>
    <div class="header-right">
      <div class="sys-time">
        <span class="label">SYS_STATUS:</span>
        <span class="value">{{ stateLabel() }}</span>
      </div>
      <div class="state-status-badge" [ngClass]="stateClass()">
        <span class="state-label">{{ state() }}</span>
      </div>
    </div>
  `,
})
export class HudHeaderComponent {
  private readonly stateService = inject(ApexStateService);

  public readonly state = this.stateService.state;

  public readonly stateClass = computed(() => {
    return this.state().toLowerCase();
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
}
