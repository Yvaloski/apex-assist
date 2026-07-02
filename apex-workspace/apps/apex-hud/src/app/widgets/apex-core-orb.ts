import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApexState } from '@apex-workspace/shared-interfaces';

@Component({
  selector: 'app-apex-core-orb',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="blobs-container">
      <div class="blobs">
        <svg viewBox="0 0 1200 1200">
          <g class="blob blob-1"><path /></g>
          <g class="blob blob-2"><path /></g>
          <g class="blob blob-3"><path /></g>
          <g class="blob blob-4"><path /></g>
          <g class="blob blob-1 alt"><path /></g>
          <g class="blob blob-2 alt"><path /></g>
          <g class="blob blob-3 alt"><path /></g>
          <g class="blob blob-4 alt"><path /></g>
        </svg>
      </div>
    </div>
  `,
  styles: [
    `
      :host {
        display: block;
        width: 100%;
        height: 100%;
      }
      .blobs-container {
        width: 100%;
        height: 100%;
        display: flex;
        justify-content: center;
        align-items: center;
        position: relative;
      }
    `,
  ],
})
export class ApexCoreOrbComponent {
  @Input() state: ApexState = 'IDLE';
}
