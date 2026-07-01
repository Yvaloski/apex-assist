import { Injectable, Logger } from '@nestjs/common';
import { Observable } from 'rxjs';
import { ApexStreamChunk, ApexState } from '@apex-workspace/shared-interfaces';

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);
  private readonly ollamaUrl = 'http://localhost:11434';

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
          const response = await fetch(`${this.ollamaUrl}/api/generate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ model, prompt, stream: true }),
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
