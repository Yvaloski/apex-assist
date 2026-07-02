import { Component, inject, computed, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApexStateService } from './services/apex-state.service';
import { HudHeaderComponent } from './widgets/hud-header';
import { TelemetryMonitorComponent } from './widgets/telemetry-monitor';
import { ControlPanelComponent } from './widgets/control-panel';
import { LogstreamComponent } from './widgets/logstream';
import { HudFooterComponent } from './widgets/hud-footer';
import { ApexCoreOrbComponent } from './widgets/apex-core-orb';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    HudHeaderComponent,
    TelemetryMonitorComponent,
    ControlPanelComponent,
    LogstreamComponent,
    HudFooterComponent,
    ApexCoreOrbComponent,
  ],
  encapsulation: ViewEncapsulation.None,
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  private readonly stateService = inject(ApexStateService);

  public readonly state = this.stateService.state;

  public readonly stateClass = computed(() => {
    return this.state().toLowerCase();
  });
}
