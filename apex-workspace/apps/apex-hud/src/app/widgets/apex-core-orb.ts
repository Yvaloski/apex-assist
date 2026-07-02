import { Component, Input, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApexState } from '@apex-workspace/shared-interfaces';

@Component({
  selector: '[app-apex-core-orb]',
  standalone: true,
  imports: [CommonModule],
  encapsulation: ViewEncapsulation.None,
  template: `
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
  `,
})
export class ApexCoreOrbComponent {
  @Input() state: ApexState = 'IDLE';
}
