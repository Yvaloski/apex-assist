import { Component, inject, computed, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApexStateService } from '../services/apex-state.service';

@Component({
  selector: '[app-telemetry-monitor]',
  standalone: true,
  imports: [CommonModule],
  encapsulation: ViewEncapsulation.None,
  template: `
    <div class="widget-header">
      <span class="widget-title">TELEMETRY_MONITOR</span>
      <span class="widget-subtitle">REAL-TIME HARDWARE SENSORS</span>
    </div>

    <div class="widget-body metrics-body">
      <div class="cli-monitor-section">
        <div class="cli-header-row">
          <span class="cli-title">CPU_LOAD_SENSORS</span>
          <span class="cli-status-text">ONLINE</span>
        </div>
        <div class="cli-bar-row">
          <span class="cli-bar-label">CPU [</span>
          <div class="cli-bar-outer">
            <div class="cli-bar-inner" [style.width.%]="systemMetrics().cpu"></div>
          </div>
          <span class="cli-bar-label">]</span>
          <span class="cli-value-text">{{ systemMetrics().cpu | number:'1.1-1' }}%</span>
        </div>
        <div class="cli-details-grid">
          <div class="cli-detail-item"><span class="lbl">CLOCK_SPEED:</span><span class="val">{{ (systemMetrics().cpuSpeed || 4.21) | number:'1.2-2' }} GHz</span></div>
          <div class="cli-detail-item"><span class="lbl">CORE_TEMP:</span><span class="val">{{ (systemMetrics().cpuTemp || 54.0) | number:'1.1-1' }}°C</span></div>
          <div class="cli-detail-item"><span class="lbl">THREAD_POOL:</span><span class="val">ACTIVE</span></div>
          <div class="cli-detail-item"><span class="lbl">LOAD_AVG:</span><span class="val">{{ (systemMetrics().cpuLoadAvg || 1.45) | number:'1.2-2' }}</span></div>
        </div>
      </div>

      <div class="cli-monitor-section">
        <div class="cli-header-row">
          <span class="cli-title">MEM_ALLOCATION</span>
          <span class="cli-status-text">OPTIMIZED</span>
        </div>
        <div class="cli-bar-row">
          <span class="cli-bar-label">RAM [</span>
          <div class="cli-bar-outer">
            <div class="cli-bar-inner" [style.width.%]="systemMetrics().ram"></div>
          </div>
          <span class="cli-bar-label">]</span>
          <span class="cli-value-text">{{ systemMetrics().ram | number:'1.1-1' }}%</span>
        </div>
        <div class="cli-details-grid">
          <div class="cli-detail-item"><span class="lbl">USED_CAP:</span><span class="val">{{ (systemMetrics().ramUsed || 0) | number:'1.1-1' }} GB</span></div>
          <div class="cli-detail-item"><span class="lbl">MAX_CAP:</span><span class="val">{{ (systemMetrics().ramTotal || 16.0) | number:'1.1-1' }} GB</span></div>
          <div class="cli-detail-item"><span class="lbl">SWAP_FILE:</span><span class="val">0.0 GB</span></div>
          <div class="cli-detail-item"><span class="lbl">CACHE_BUF:</span><span class="val">4.1 GB</span></div>
        </div>
      </div>

      <div class="cli-monitor-section diagnostic-section">
        <div class="cli-header-row"><span class="cli-title">NETWORK_DIAGNOSTICS</span></div>
        <div class="diagnostic-lines">
          <div>NODE_ADDR: {{ networkMetrics().nodeAddr }}</div>
          <div>WS_LATENCY: {{ networkMetrics().wsLatency }}ms</div>
          <div>BUFFER_STATUS: {{ networkMetrics().bufferStatus }}</div>
          <div>PACKET_LOSS: {{ networkMetrics().packetLoss | number:'1.2-2' }}%</div>
        </div>
      </div>

      <div class="cli-monitor-section processes-section" *ngIf="systemMetrics().topProcesses?.length">
        <div class="cli-header-row">
          <span class="cli-title">ACTIVE_PROCESS_MONITOR</span>
          <span class="cli-status-text">TOP_CPU</span>
        </div>
        <div class="process-list">
          <div class="process-header">
            <span class="proc-pid">PID</span>
            <span class="proc-name">NAME</span>
            <span class="proc-cpu">CPU</span>
            <span class="proc-mem">MEM</span>
          </div>
          <div class="process-item" *ngFor="let proc of systemMetrics().topProcesses">
            <span class="proc-pid">{{ proc.pid }}</span>
            <span class="proc-name">{{ proc.name }}</span>
            <span class="proc-cpu">{{ proc.cpu | number:'1.0-1' }}%</span>
            <span class="proc-mem">{{ proc.mem | number:'1.0-1' }}%</span>
          </div>
        </div>
      </div>
    </div>
  `,
})
export class TelemetryMonitorComponent {
  private readonly stateService = inject(ApexStateService);

  public readonly systemMetrics = this.stateService.systemMetrics;
  private readonly state = this.stateService.state;

  public readonly networkMetrics = computed(() => {
    const s = this.state();
    return {
      nodeAddr: '127.0.0.1:4200',
      wsLatency: s === 'THINKING' ? 14 : 4,
      bufferStatus: s === 'THINKING' ? 'PROCESSING' : 'NOMINAL',
      packetLoss: 0.0,
    };
  });
}
