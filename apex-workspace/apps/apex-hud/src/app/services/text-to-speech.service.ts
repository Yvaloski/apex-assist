import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class TextToSpeechService {
  private sentenceBuffer = '';
  private availableVoices: SpeechSynthesisVoice[] = [];

  constructor() {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      this.availableVoices = window.speechSynthesis.getVoices();
      window.speechSynthesis.onvoiceschanged = () => {
        this.availableVoices = window.speechSynthesis.getVoices();
      };
    }
  }

  /**
   * Cancel any ongoing speech and clear the buffer.
   */
  public cancel(): void {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    this.sentenceBuffer = '';
  }

  /**
   * Feed a new text chunk. Extracts and speaks complete sentences.
   */
  public feedChunk(content: string): void {
    if (typeof window === 'undefined' || !window.speechSynthesis) {
      return;
    }

    this.sentenceBuffer += content;

    // Matches standard sentence endings (. ! ?) followed by whitespace or end-of-string.
    // Also splits on newlines to ensure clean speech pauses.
    const sentenceRegex = /[^.!?\n]+[.!?\n]+/g;
    const sentences: string[] = [];
    let match;
    let lastIndex = 0;

    while ((match = sentenceRegex.exec(this.sentenceBuffer)) !== null) {
      sentences.push(match[0]);
      lastIndex = sentenceRegex.lastIndex;
    }

    if (sentences.length > 0) {
      this.sentenceBuffer = this.sentenceBuffer.substring(lastIndex);
      for (const sentence of sentences) {
        this.speakSentence(sentence.trim());
      }
    }
  }

  /**
   * Speak any remaining text left in the buffer.
   */
  public flush(): void {
    if (typeof window === 'undefined' || !window.speechSynthesis) {
      return;
    }
    const remaining = this.sentenceBuffer.trim();
    if (remaining) {
      this.speakSentence(remaining);
      this.sentenceBuffer = '';
    }
  }

  /**
   * Speak an entire block of text directly, canceling any active speech first.
   */
  public speak(text: string): void {
    this.cancel();
    if (typeof window !== 'undefined' && window.speechSynthesis && text.trim()) {
      this.speakSentence(text.trim());
    }
  }

  /**
   * Build and queue a SpeechSynthesisUtterance.
   */
  private speakSentence(text: string): void {
    if (!text) return;
    try {
      const utterance = new SpeechSynthesisUtterance(text);
      
      if (this.availableVoices.length === 0 && window.speechSynthesis) {
        this.availableVoices = window.speechSynthesis.getVoices();
      }

      const bestVoice = this.getBestVoice(this.availableVoices);
      if (bestVoice) {
        utterance.voice = bestVoice;
        utterance.lang = bestVoice.lang;
      }
      
      // Futuristic adjustments: slightly faster rate, deeper tone.
      utterance.rate = 1.08;
      utterance.pitch = 0.95;

      window.speechSynthesis.speak(utterance);
    } catch (err) {
      console.warn('SpeechSynthesis error:', err);
    }
  }

  private getBestVoice(voices: SpeechSynthesisVoice[]): SpeechSynthesisVoice | null {
    // 1. Google High-quality voice in Chrome
    let voice = voices.find(v => v.name.includes('Google US English') || v.name.includes('Google'));
    if (voice) return voice;

    // 2. Clear female sci-fi voice (Zira or Hortense)
    voice = voices.find(v => v.name.includes('Zira') || v.name.includes('Hortense'));
    if (voice) return voice;

    // 3. Clear male voice (David)
    voice = voices.find(v => v.name.includes('David'));
    if (voice) return voice;

    // 4. Default English
    voice = voices.find(v => v.lang.startsWith('en'));
    if (voice) return voice;

    // 5. Default French
    voice = voices.find(v => v.lang.startsWith('fr'));
    if (voice) return voice;

    return voices[0] || null;
  }
}
