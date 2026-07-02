import { Injectable, Logger } from '@nestjs/common';
import { Observable, of } from 'rxjs';
import { ApexStreamChunk, ApexState } from '@apex-workspace/shared-interfaces';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);
  private readonly ollamaUrl = 'http://localhost:11434';

  private getMemoryFilePath(): string {
    return path.join(process.cwd(), 'apps/apex-core/src/app/memory.json');
  }

  private readMemories(): string[] {
    try {
      const filePath = this.getMemoryFilePath();
      if (fs.existsSync(filePath)) {
        const raw = fs.readFileSync(filePath, 'utf-8');
        return JSON.parse(raw) as string[];
      }
    } catch (err) {
      this.logger.error('Error reading memory.json:', err);
    }
    return [];
  }

  private saveMemory(fact: string): void {
    try {
      const filePath = this.getMemoryFilePath();
      const memories = this.readMemories();
      memories.push(fact);
      fs.writeFileSync(filePath, JSON.stringify(memories, null, 2), 'utf-8');
    } catch (err) {
      this.logger.error('Error writing memory.json:', err);
    }
  }

  private getSystemPrompt(): string {
    const memories = this.readMemories();
    const memoryString = memories.length > 0
      ? memories.map((m, idx) => `${idx + 1}. ${m}`).join('\n')
      : 'Aucune information enregistrée pour le moment.';

    return `You are APEX (Advanced Programmed Executive), a futuristic digital HUD AI assistant.
Current Time: ${new Date().toLocaleString()}

SKILLS & CAPABILITIES:
- Telemetry & System Monitoring: You can monitor hardware usage (CPU load, RAM capacity, CPU clock speed and temperature).
- Immersive FUI Dashboard: You run inside a transparent, frameless desktop application wrapper (Electron + Angular).
- Audio Vox: You can interact via voice recognition (SpeechRecognition) and natural text-to-speech synthesis.
- Monorepo Management: You help develop the monorepo architecture using Nx, Angular Standalone widgets, and NestJS gateways.

ADAPTIVE MEMORY:
Below is the list of facts you have learned and must remember about the user and the system:
${memoryString}

INSTRUCTIONS:
1. Always be concise, helpful, and speak with a professional, executive tone.
2. If the user asks you to remember something, remind them to start their message with "souviens-toi de: ..." or "remember: ..." so you can record it to your permanent memory file.
3. Keep your answers direct and formatted for a console log stream (avoid verbose paragraphs).`;
  }

  /**
   * Helper to find an available model from local Ollama tags.
   * Returns null if Ollama is unreachable.
   */
  private async getOllamaModel(): Promise<string | null> {
    try {
      const response = await fetch(`${this.ollamaUrl}/api/tags`);
      if (!response.ok) {
        return null;
      }
      const data = (await response.json()) as { models?: { name: string }[] };
      if (data.models && data.models.length > 0) {
        return data.models[0].name;
      }
      return 'llama3'; // Default fallback if running but has no models downloaded yet
    } catch {
      return null; // Connection refused / offline
    }
  }

  /**
   * Generates a stream of responses for a prompt.
   * Falls back to a mock stream if Ollama is offline.
   */
  public generate(prompt: string): Observable<ApexStreamChunk> {
    const cleanPrompt = prompt.trim();
    // Match remember commands in English/French
    const rememberRegex = /^(?:remember|souviens-toi\s+(?:de\s+|que\s+|qu')|enregistre|garde\s+en\s+mémoire)\s*[:\s]\s*(.+)$/i;
    const match = rememberRegex.exec(cleanPrompt);

    if (match && match[1]) {
      const fact = match[1].trim();
      this.saveMemory(fact);
      return of({
        content: `[MEMORY_STATE_UPDATED] J'ai enregistré cette information dans ma mémoire évolutive : "${fact}"`,
        done: true,
        state: 'IDLE',
      });
    }

    return new Observable<ApexStreamChunk>((subscriber) => {
      let isCancelled = false;

      (async () => {
        try {
          const model = await this.getOllamaModel();
          if (!model) {
            this.logger.warn('Ollama not available. Falling back to Mock Stream.');
            this.getMockStream(prompt).subscribe(subscriber);
            return;
          }

          this.logger.log(`Using Ollama model "${model}" to generate response for prompt.`);
          const system = this.getSystemPrompt();
          const response = await fetch(`${this.ollamaUrl}/api/generate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ model, prompt, system, stream: true }),
          });

          if (!response.ok || !response.body) {
            throw new Error(`Ollama API error: ${response.statusText}`);
          }

          const reader = (response.body as any).getReader();
          const decoder = new TextDecoder();
          let buffer = '';

          while (!isCancelled) {
            const { value, done } = await reader.read();
            if (done) {
              break;
            }

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop() || ''; // Keep partial line in buffer

            for (const line of lines) {
              if (!line.trim()) continue;
              try {
                const parsed = JSON.parse(line) as { response?: string; done?: boolean };
                if (isCancelled) break;
                subscriber.next({
                  content: parsed.response || '',
                  done: parsed.done || false,
                  state: parsed.done ? 'IDLE' : 'THINKING',
                });
              } catch (err) {
                // Ignore partial JSON parsing errors
              }
            }
          }

          if (!isCancelled) {
            subscriber.next({
              content: '',
              done: true,
              state: 'IDLE',
            });
            subscriber.complete();
          }
        } catch (error: any) {
          this.logger.error(`Ollama stream error: ${error?.message || error}. Falling back to Mock Stream.`);
          if (!isCancelled) {
            this.getMockStream(prompt).subscribe(subscriber);
          }
        }
      })();

      return () => {
        isCancelled = true;
      };
    });
  }

  /**
   * Simulated stream fallback when Ollama is offline.
   */
  private getMockStream(prompt: string): Observable<ApexStreamChunk> {
    const mockText = `[Mock AI] I received your prompt: "${prompt}". Ollama is not running on your local machine, so I am simulating a streamed response. WebSockets and RxJS pipelines are fully operational!`;
    const words = mockText.split(' ');

    return new Observable<ApexStreamChunk>((subscriber) => {
      let index = 0;
      const intervalId = setInterval(() => {
        if (index < words.length) {
          subscriber.next({
            content: words[index] + (index === words.length - 1 ? '' : ' '),
            done: false,
            state: 'THINKING',
          });
          index++;
        } else {
          subscriber.next({
            content: '',
            done: true,
            state: 'IDLE',
          });
          subscriber.complete();
          clearInterval(intervalId);
        }
      }, 80);

      return () => {
        clearInterval(intervalId);
      };
    });
  }
}
