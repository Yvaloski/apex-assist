import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class TextToSpeechService {
  private sentenceBuffer = '';
  private availableVoices: SpeechSynthesisVoice[] = [];
  private activeUtterances = new Set<SpeechSynthesisUtterance>();

  constructor() {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      if (typeof window.speechSynthesis.getVoices === 'function') {
        this.availableVoices = window.speechSynthesis.getVoices();
      }
      window.speechSynthesis.onvoiceschanged = () => {
        if (window.speechSynthesis && typeof window.speechSynthesis.getVoices === 'function') {
          this.availableVoices = window.speechSynthesis.getVoices();
        }
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
    this.activeUtterances.clear();
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
      if (typeof window === 'undefined' || !window.speechSynthesis) {
        return;
      }

      // Resume if stuck or paused
      if (window.speechSynthesis.paused) {
        window.speechSynthesis.resume();
      }

      const utterance = new SpeechSynthesisUtterance(text);
      
      if (this.availableVoices.length === 0 && typeof window.speechSynthesis.getVoices === 'function') {
        this.availableVoices = window.speechSynthesis.getVoices();
      }

      const bestVoice = this.getBestVoice(this.availableVoices, text);
      if (bestVoice) {
        utterance.voice = bestVoice;
        utterance.lang = bestVoice.lang;
      }
      
      // Clean, natural sound for speech: 1.0 rate and pitch avoids mechanical distortion
      utterance.rate = 1.0;
      utterance.pitch = 1.0;

      // Prevent garbage collection which causes Chrome queue hangs
      this.activeUtterances.add(utterance);

      utterance.onend = () => {
        this.activeUtterances.delete(utterance);
      };

      utterance.onerror = (event) => {
        console.warn('SpeechSynthesisUtterance error:', event);
        this.activeUtterances.delete(utterance);
      };

      window.speechSynthesis.speak(utterance);
    } catch (err) {
      console.warn('SpeechSynthesis error:', err);
    }
  }

  private isFrenchText(text: string): boolean {
    const frenchRegex = /[éàèùçêëïôœæ]/i;
    if (frenchRegex.test(text)) return true;

    const frenchWords = /\b(le|la|les|un|une|des|est|sont|dans|pour|avec|vous|nous|suis|projet|système|directive|activé|reconnu|erreur|connexion|ordinateur)\b/i;
    return frenchWords.test(text);
  }

  private getBestVoice(voices: SpeechSynthesisVoice[], text: string): SpeechSynthesisVoice | null {
    if (!voices || voices.length === 0) return null;

    const isFrench = this.isFrenchText(text);

    if (isFrench) {
      // 1. Google French (Chrome)
      let voice = voices.find(v => v.lang.startsWith('fr') && v.name.includes('Google'));
      if (voice) return voice;

      // 2. Microsoft French (Edge / Windows SAPI)
      voice = voices.find(v => v.lang.startsWith('fr') && (v.name.includes('Hortense') || v.name.includes('Microsoft')));
      if (voice) return voice;

      // 3. Apple French (macOS / iOS)
      voice = voices.find(v => v.lang.startsWith('fr') && (v.name.includes('Thomas') || v.name.includes('Amélie') || v.name.includes('Audrey')));
      if (voice) return voice;

      // 4. Any French voice
      voice = voices.find(v => v.lang.startsWith('fr'));
      if (voice) return voice;
    } else {
      // 1. Google English (Chrome)
      let voice = voices.find(v => v.lang.startsWith('en') && v.name.includes('Google US English'));
      if (voice) return voice;
      
      voice = voices.find(v => v.lang.startsWith('en') && v.name.includes('Google'));
      if (voice) return voice;

      // 2. Microsoft English (Edge Aria / Guy, or standard Microsoft)
      voice = voices.find(v => v.lang.startsWith('en') && (v.name.includes('Aria') || v.name.includes('Guy') || v.name.includes('Microsoft')));
      if (voice) return voice;

      // 3. Apple English (macOS / iOS)
      voice = voices.find(v => v.lang.startsWith('en') && (v.name.includes('Samantha') || v.name.includes('Daniel') || v.name.includes('Alex')));
      if (voice) return voice;

      // 4. Any English voice
      voice = voices.find(v => v.lang.startsWith('en'));
      if (voice) return voice;
    }

    // Cross-fallback
    if (isFrench) {
      const enVoice = voices.find(v => v.lang.startsWith('en'));
      if (enVoice) return enVoice;
    } else {
      const frVoice = voices.find(v => v.lang.startsWith('fr'));
      if (frVoice) return frVoice;
    }

    return voices.find(v => v.default) || voices[0] || null;
  }
}
