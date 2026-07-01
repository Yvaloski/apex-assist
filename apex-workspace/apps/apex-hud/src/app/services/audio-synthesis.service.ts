import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class AudioSynthesisService {
  private ctx: AudioContext | null = null;

  constructor() {}

  /**
   * Lazily initialize and resume AudioContext.
   */
  private getContext(): AudioContext | null {
    if (typeof window === 'undefined') {
      return null;
    }
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) {
      return null;
    }
    if (!this.ctx) {
      this.ctx = new AudioContextClass();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume().catch((err) => console.warn('AudioContext resume failed:', err));
    }
    return this.ctx;
  }

  /**
   * Play a short upward chime when transition to LISTENING begins (chirp/beep).
   */
  public playListeningChirp(): void {
    const ctx = this.getContext();
    if (!ctx) return;

    const now = ctx.currentTime;

    // Osc 1: Fundamental frequency sweep (sine)
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(600, now);
    osc1.frequency.exponentialRampToValueAtTime(1200, now + 0.15);

    gain1.gain.setValueAtTime(0.001, now);
    gain1.gain.linearRampToValueAtTime(0.08, now + 0.02);
    gain1.gain.exponentialRampToValueAtTime(0.0001, now + 0.15);

    osc1.connect(gain1);
    gain1.connect(ctx.destination);

    // Osc 2: Harmonic (triangle) to give it a richer, futuristic timbre
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(900, now);
    osc2.frequency.exponentialRampToValueAtTime(1800, now + 0.15);

    gain2.gain.setValueAtTime(0.001, now);
    gain2.gain.linearRampToValueAtTime(0.03, now + 0.02);
    gain2.gain.exponentialRampToValueAtTime(0.0001, now + 0.15);

    osc2.connect(gain2);
    gain2.connect(ctx.destination);

    osc1.start(now);
    osc2.start(now);

    osc1.stop(now + 0.16);
    osc2.stop(now + 0.16);
  }

  /**
   * Play a quick processing tone when transitioning to THINKING.
   */
  public playThinkingTone(): void {
    const ctx = this.getContext();
    if (!ctx) return;

    const now = ctx.currentTime;

    // Blip 1: 520Hz triangle tone
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'triangle';
    osc1.frequency.setValueAtTime(520, now);
    gain1.gain.setValueAtTime(0.001, now);
    gain1.gain.linearRampToValueAtTime(0.06, now + 0.01);
    gain1.gain.exponentialRampToValueAtTime(0.0001, now + 0.05);

    osc1.connect(gain1);
    gain1.connect(ctx.destination);

    // Blip 2: 780Hz triangle tone, offset slightly
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(780, now + 0.05);
    gain2.gain.setValueAtTime(0.001, now + 0.05);
    gain2.gain.linearRampToValueAtTime(0.05, now + 0.06);
    gain2.gain.exponentialRampToValueAtTime(0.0001, now + 0.10);

    osc2.connect(gain2);
    gain2.connect(ctx.destination);

    osc1.start(now);
    osc1.stop(now + 0.06);

    osc2.start(now + 0.05);
    osc2.stop(now + 0.11);
  }

  /**
   * Play a soft confirm chime when transitioning back to IDLE after AI completes streaming.
   */
  public playConfirmChime(): void {
    const ctx = this.getContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const notes = [
      { freq: 659.25, timeOffset: 0.0 },   // E5
      { freq: 880.00, timeOffset: 0.05 },  // A5
      { freq: 1109.73, timeOffset: 0.10 }, // C#6
      { freq: 1318.51, timeOffset: 0.15 }  // E6
    ];

    notes.forEach((note) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(note.freq, now + note.timeOffset);

      // Play soft sound with nice slow decay
      gain.gain.setValueAtTime(0.0001, now + note.timeOffset);
      gain.gain.linearRampToValueAtTime(0.05, now + note.timeOffset + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + note.timeOffset + 0.6);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now + note.timeOffset);
      osc.stop(now + note.timeOffset + 0.65);
    });
  }
}
