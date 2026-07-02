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
  private executeListDir(dirPath: string): string {
    try {
      const resolved = path.resolve(process.cwd(), dirPath);
      if (!fs.existsSync(resolved)) {
        return `Error: Directory ${dirPath} does not exist.`;
      }
      const stats = fs.statSync(resolved);
      if (!stats.isDirectory()) {
        return `Error: Path ${dirPath} is a file, not a directory.`;
      }
      const items = fs.readdirSync(resolved);
      const details = items.map(item => {
        const itemPath = path.join(resolved, item);
        const itemStats = fs.statSync(itemPath);
        return `${itemStats.isDirectory() ? '[DIR]' : '[FILE]'} ${item} (${itemStats.size} bytes)`;
      });
      return `Directory listing of ${dirPath}:\n` + details.join('\n');
    } catch (err: any) {
      return `Error listing directory: ${err.message}`;
    }
  }

  private executeReadFile(filePath: string): string {
    try {
      const resolved = path.resolve(process.cwd(), filePath);
      if (!fs.existsSync(resolved)) {
        return `Error: File ${filePath} does not exist.`;
      }
      const stats = fs.statSync(resolved);
      if (stats.isDirectory()) {
        return `Error: Path ${filePath} is a directory, not a file.`;
      }
      if (stats.size > 20000) {
        return `Error: File ${filePath} is too large (${stats.size} bytes). Max read size is 20KB.`;
      }
      const content = fs.readFileSync(resolved, 'utf-8');
      return `Content of file ${filePath}:\n\`\`\`\n${content}\n\`\`\``;
    } catch (err: any) {
      return `Error reading file: ${err.message}`;
    }
  }

  private executeRunCommand(command: string): string {
    try {
      const { execSync } = require('child_process');
      const allowedPrefixes = ['git', 'nx', 'npm', 'node', 'dir', 'ls'];
      const cmdWord = command.trim().split(' ')[0].toLowerCase();
      if (!allowedPrefixes.includes(cmdWord)) {
        return `Error: Command execution blocked. Command "${cmdWord}" is not in the whitelist (${allowedPrefixes.join(', ')}).`;
      }
      const output = execSync(command, { encoding: 'utf-8', timeout: 5000, cwd: process.cwd() });
      return `Command "${command}" executed successfully. Output:\n${output}`;
    } catch (err: any) {
      return `Error executing command: ${err.message || err.stderr || err}`;
    }
  }

  private async runGeneratorLoop(
    promptText: string,
    systemPrompt: string,
    subscriber: any,
    isCancelled: () => boolean,
    loopTurn = 0
  ): Promise<void> {
    if (loopTurn > 3) {
      subscriber.next({
        content: `\n[SYSTEM_LIMIT] Maximum ReAct agent iterations (3) reached. Stopping loop.`,
        done: true,
        state: 'IDLE'
      });
      subscriber.complete();
      return;
    }

    const model = await this.getOllamaModel();
    if (!model) {
      this.getMockStream(promptText).subscribe(subscriber);
      return;
    }

    const response = await fetch(`${this.ollamaUrl}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model, prompt: promptText, system: systemPrompt, stream: true }),
    });

    if (!response.ok || !response.body) {
      throw new Error(`Ollama API error: ${response.statusText}`);
    }

    const reader = (response.body as any).getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    let responseText = '';
    let cmdBuffer = '';
    let collectingCmd = false;
    let preCmdText = '';

    while (!isCancelled()) {
      const { value, done } = await reader.read();
      if (done) {
        break;
      }

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (!line.trim()) continue;
        try {
          const parsed = JSON.parse(line) as { response?: string; done?: boolean };
          if (isCancelled()) break;

          const chunkContent = parsed.response || '';
          responseText += chunkContent;

          if (!collectingCmd && responseText.includes('[CMD:')) {
            collectingCmd = true;
            const startIdx = responseText.indexOf('[CMD:');
            preCmdText = responseText.slice(0, startIdx);
            if (preCmdText) {
              subscriber.next({
                content: preCmdText,
                done: false,
                state: 'THINKING',
              });
            }
            cmdBuffer = responseText.slice(startIdx);
            responseText = cmdBuffer;
          } else if (collectingCmd) {
            cmdBuffer += chunkContent;
            responseText = cmdBuffer;

            if (cmdBuffer.includes(']')) {
              collectingCmd = false;
              const endIdx = cmdBuffer.indexOf(']');
              const fullCmdTag = cmdBuffer.slice(0, endIdx + 1);

              const cmdMatch = /\[CMD:\s*(\w+)\s+(.+)\]/.exec(fullCmdTag);
              if (cmdMatch) {
                const action = cmdMatch[1];
                const arg = cmdMatch[2].trim();

                subscriber.next({
                  content: `\n[CORE_LINK] DIRECTIVE DETECTED: ${action} ${arg}\n[CORE_LINK] EXECUTING SYSTEM INSTRUCTION...\n`,
                  done: false,
                  state: 'THINKING',
                });

                let result = '';
                if (action === 'list_dir') {
                  result = this.executeListDir(arg);
                } else if (action === 'read_file') {
                  result = this.executeReadFile(arg);
                } else if (action === 'run_command') {
                  result = this.executeRunCommand(arg);
                } else {
                  result = `Error: Unknown action "${action}".`;
                }

                subscriber.next({
                  content: `[CORE_LINK] EXECUTION COMPLETED (${result.split('\n')[0]})\n`,
                  done: false,
                  state: 'THINKING',
                });

                const newPrompt = `${promptText}\nAssistant: ${preCmdText || ''}${fullCmdTag}\nSystem: ${result}\nAssistant:`;
                await this.runGeneratorLoop(newPrompt, systemPrompt, subscriber, isCancelled, loopTurn + 1);
                return;
              }
            }
          } else {
            subscriber.next({
              content: chunkContent,
              done: false,
              state: 'THINKING',
            });
          }
        } catch (err) {
          // Ignore JSON parsing errors
        }
      }
    }

    if (!isCancelled()) {
      subscriber.next({
        content: '',
        done: true,
        state: 'IDLE',
      });
      subscriber.complete();
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

    // Match forget commands (forget all, oublie tout, forget 1, oublie 1)
    const forgetRegex = /^(?:forget|oublie)\s+(all|tout|\d+)$/i;
    const forgetMatch = forgetRegex.exec(cleanPrompt);
    if (forgetMatch && forgetMatch[1]) {
      const target = forgetMatch[1].trim().toLowerCase();
      if (target === 'all' || target === 'tout') {
        try {
          fs.writeFileSync(this.getMemoryFilePath(), '[]', 'utf-8');
          return of({
            content: `[MEMORY_STATE_UPDATED] Ma mémoire évolutive a été entièrement réinitialisée.`,
            done: true,
            state: 'IDLE',
          });
        } catch (err) {
          return of({
            content: `[MEMORY_ERROR] Échec de la réinitialisation de la mémoire.`,
            done: true,
            state: 'IDLE',
          });
        }
      } else {
        const index = parseInt(target, 10) - 1;
        const memories = this.readMemories();
        if (index >= 0 && index < memories.length) {
          const removed = memories.splice(index, 1)[0];
          try {
            fs.writeFileSync(this.getMemoryFilePath(), JSON.stringify(memories, null, 2), 'utf-8');
            return of({
              content: `[MEMORY_STATE_UPDATED] J'ai effacé ce souvenir de ma mémoire : "${removed}"`,
              done: true,
              state: 'IDLE',
            });
          } catch (err) {
            return of({
              content: `[MEMORY_ERROR] Échec de la suppression du souvenir.`,
              done: true,
              state: 'IDLE',
            });
          }
        } else {
          return of({
            content: `[MEMORY_WARNING] Aucun souvenir trouvé à l'index ${target}. Tapez "/memories" pour voir la liste.`,
            done: true,
            state: 'IDLE',
          });
        }
      }
    }

    // Match list memories command (/memories, liste ta mémoire)
    const listRegex = /^(?:\/memories|liste\s+(?:ta\s+mémoire|des\s+souvenirs))$/i;
    if (listRegex.test(cleanPrompt)) {
      const memories = this.readMemories();
      const content = memories.length > 0
        ? `[MEMORY_DUMP] Voici les informations enregistrées dans ma mémoire :\n` + memories.map((m, idx) => `${idx + 1}. ${m}`).join('\n')
        : `[MEMORY_DUMP] Ma mémoire évolutive est actuellement vide.`;
      return of({
        content,
        done: true,
        state: 'IDLE',
      });
    }

    return new Observable<ApexStreamChunk>((subscriber) => {
      let isCancelled = false;

      (async () => {
        try {
          const system = this.getSystemPrompt();
          await this.runGeneratorLoop(prompt, system, subscriber, () => isCancelled);
        } catch (error: any) {
          this.logger.error(`Ollama stream loop error: ${error?.message || error}. Falling back to Mock Stream.`);
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
