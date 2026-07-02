import {
  Component,
  ElementRef,
  ViewChild,
  afterNextRender,
  OnDestroy,
  Input,
  OnChanges,
  SimpleChanges,
} from '@angular/core';

import type P5 from 'p5';
import { ApexState } from '@apex-workspace/shared-interfaces';

@Component({
  selector: 'app-apex-core-orb',
  standalone: true,
  template: `
    <div #canvasContainer class="orb-canvas-container">
      <!-- Le cœur sombre central pour donner de la profondeur à l'aura comme sur ton image -->
      <div class="inner-dark-core"></div>
    </div>
  `,
  styles: [
    `
      :host {
        display: block;
        width: 100%;
        height: 100%;
        position: relative;
      }
      .orb-canvas-container {
        width: 100%;
        height: 100%;
        display: flex;
        justify-content: center;
        align-items: center;
        position: relative;
        background: transparent;
      }

      /* 🟢 LE SECRET VISUEL : Un flou gaussien massif combiné à un mode de fusion */
      ::ng-deep canvas {
        display: block;
        filter: blur(40px); /* Fusionne les formes en un fluide gazeux */
        mix-blend-mode: screen; /* Fait briller les couleurs superposées */
      }

      /* Le centre sombre qui absorbe la lumière au milieu de l'orbe */
      .inner-dark-core {
        position: absolute;
        width: 120px;
        height: 120px;
        background: #02060d;
        border-radius: 50%;
        z-index: 2;
        filter: blur(10px);
        box-shadow: inset 0 0 20px rgba(0, 0, 0, 0.9);
        pointer-events: none;
      }
    `,
  ],
})
export class ApexCoreOrbComponent implements OnDestroy, OnChanges {
  @ViewChild('canvasContainer', { static: true })
  canvasContainer!: ElementRef<HTMLDivElement>;

  @Input() coreColor: { r: number; g: number; b: number } = {
    r: 0,
    g: 229,
    b: 255,
  };
  @Input() state: ApexState = 'IDLE';

  private p5Instance?: P5;
  private t = 0;
  private scaleFactor = 140;

  constructor() {
    afterNextRender(async () => {
      const p5Module = await import('p5');
      const P5Constructor = p5Module.default;
      this.p5Instance = new P5Constructor(
        this.createSketch,
        this.canvasContainer.nativeElement,
      );
    });
  }

  ngOnDestroy(): void {
    if (this.p5Instance) this.p5Instance.remove();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (this.p5Instance && (changes['coreColor'] || changes['state'])) {
      // Les changements sont captés en continu par draw()
    }
  }

  private createSketch = (p: P5) => {
    const comp = this;
    const currentInstance: P5 = p;

    p.setup = () => {
      const containerWidth = comp.canvasContainer.nativeElement.offsetWidth;
      const containerHeight = comp.canvasContainer.nativeElement.offsetHeight;
      p.createCanvas(containerWidth, containerHeight);
      p.noStroke(); // Pas de lignes dures, uniquement des formes lisses
    };

    p.windowResized = () => {
      const containerWidth = comp.canvasContainer.nativeElement.offsetWidth;
      const containerHeight = comp.canvasContainer.nativeElement.offsetHeight;
      p.resizeCanvas(containerWidth, containerHeight);
      comp.scaleFactor = Math.min(containerWidth, containerHeight) * 0.32;
    };

    p.draw = () => {
      p.clear();

      const centerX = p.width / 2;
      const centerY = p.height / 2;

      // Fréquence d'oscillation selon l'état de l'application
      let speed = 0.015;
      if (comp.state === 'THINKING') speed = 0.05;
      if (comp.state === 'LISTENING') speed = 0.03;

      // ==========================================================
      // COUCHE 1 : L'AURA INFERIEURE (Violet / Magenta en arrière)
      // ==========================================================
      p.push();
      // On utilise la couleur complémentaire violette présente sur ton image
      p.fill(140, 40, 230, 180);
      p.beginShape();
      for (let a = 0; a < p.TWO_PI; a += 0.05) {
        // Mapping circulaire pour que le bruit se boucle parfaitement sur 360°
        const xoff = p.map(p.cos(a), -1, 1, 0, 1.5);
        const yoff = p.map(p.sin(a), -1, 1, 0, 1.5);

        // Déformation organique asymétrique
        const r =
          comp.scaleFactor *
          (0.9 + currentInstance.noise(xoff, yoff, comp.t * speed) * 0.4);
        const x = centerX + r * p.cos(a);
        const y = centerY + r * p.sin(a);
        p.vertex(x, y);
      }
      p.endShape(p.CLOSE);
      p.pop();

      // ==========================================================
      // COUCHE 2 : L'AURA SUPERIEURE (Cyan / Bleu principal en avant)
      // ==========================================================
      p.push();
      p.fill(comp.coreColor.r, comp.coreColor.g, comp.coreColor.b, 210);
      p.beginShape();
      for (let a = 0; a < p.TWO_PI; a += 0.05) {
        // Décale les offsets du bruit pour que les deux couches ne bougent pas de la même manière
        const xoff = p.map(p.cos(a), -1, 1, 3, 4.5);
        const yoff = p.map(p.sin(a), -1, 1, 3, 4.5);

        const r =
          comp.scaleFactor *
          (0.85 +
            currentInstance.noise(xoff, yoff, comp.t * (speed * 0.95)) * 0.35);
        const x = centerX + r * p.cos(a);
        const y = centerY + r * p.sin(a);
        p.vertex(x, y);
      }
      p.endShape(p.CLOSE);
      p.pop();

      comp.t++;
    };
  };
}
