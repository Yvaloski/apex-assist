import { Component, ViewEncapsulation } from '@angular/core';

@Component({
  selector: '[app-hud-footer]',
  standalone: true,
  encapsulation: ViewEncapsulation.None,
  template: `
    <div class="footer-left">
      <span>SYSTEM: APEX_V1.0.0</span>
      <span class="divider">|</span>
      <span>ENCRYPTION: AES_256_GCM</span>
    </div>
    <div class="footer-center">
      <span>STATUS_OK // DATA_STREAM_STABLE // READY</span>
    </div>
    <div class="footer-right">
      <span>© 2026 DEEPMIND // APEX_COGNITION</span>
    </div>
  `,
})
export class HudFooterComponent {}
