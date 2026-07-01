import { Test, TestingModule } from '@nestjs/testing';
import { AiService } from './ai.service';
import { take, toArray } from 'rxjs/operators';

describe('AiService', () => {
  let service: AiService;
  let originalFetch: typeof fetch;

  beforeAll(() => {
    originalFetch = global.fetch;
  });

  afterAll(() => {
    global.fetch = originalFetch;
  });

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AiService],
    }).compile();

    service = module.get<AiService>(AiService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should fall back to mock stream if Ollama is offline', (done) => {
    // Mock fetch to throw connection error
    global.fetch = jest.fn().mockRejectedValue(new Error('Connect ECONNREFUSED 127.0.0.1:11434'));

    service
      .generate('test prompt')
      .pipe(toArray())
      .subscribe({
        next: (chunks) => {
          expect(chunks.length).toBeGreaterThan(1);
          
          // Reconstruct the full string from chunks
          const fullMessage = chunks.map(c => c.content).join('');
          expect(fullMessage).toContain('[Mock AI]');
          expect(fullMessage).toContain('test prompt');

          // Check that intermediate chunks are marked as THINKING and not done
          expect(chunks[0].state).toBe('THINKING');
          expect(chunks[0].done).toBe(false);

          // Last chunk should indicate completion
          const lastChunk = chunks[chunks.length - 1];
          expect(lastChunk.content).toBe('');
          expect(lastChunk.state).toBe('IDLE');
          expect(lastChunk.done).toBe(true);
          done();
        },
        error: (err) => done(err),
      });
  });
});
