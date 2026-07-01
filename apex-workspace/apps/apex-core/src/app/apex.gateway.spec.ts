import { Test, TestingModule } from '@nestjs/testing';
import { ApexGateway } from './apex.gateway';
import { SystemMonitorService } from './system-monitor.service';
import { AiService } from './ai.service';
import { of } from 'rxjs';

describe('ApexGateway', () => {
  let gateway: ApexGateway;
  let aiService: AiService;

  const mockMetrics$ = of({ cpu: 20, ram: 30 });
  const mockSystemMonitorService = {
    metrics$: mockMetrics$,
  };

  const mockAiService = {
    generate: jest.fn().mockReturnValue(
      of(
        { content: 'chunk1', done: false, state: 'THINKING' },
        { content: 'chunk2', done: true, state: 'IDLE' }
      )
    ),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ApexGateway,
        { provide: SystemMonitorService, useValue: mockSystemMonitorService },
        { provide: AiService, useValue: mockAiService },
      ],
    }).compile();

    gateway = module.get<ApexGateway>(ApexGateway);
    aiService = module.get<AiService>(AiService);

    // Mock socket.io server
    gateway.server = {
      emit: jest.fn(),
      sockets: {
        sockets: {
          size: 0,
        },
      },
    } as any;
  });

  it('should be defined', () => {
    expect(gateway).toBeDefined();
  });

  it('should start broadcasting metrics on connection', () => {
    const mockSocket = { id: 'socket1' } as any;
    gateway.handleConnection(mockSocket);
    expect(gateway.server.emit).toHaveBeenCalledWith('system-metrics', { cpu: 20, ram: 30 });
  });

  it('should handle prompt message and emit streaming responses', () => {
    const mockSocket = {
      id: 'socket2',
      emit: jest.fn(),
      once: jest.fn(),
    } as any;

    gateway.handlePrompt({ prompt: 'test prompt' }, mockSocket);

    expect(aiService.generate).toHaveBeenCalledWith('test prompt');
    expect(mockSocket.emit).toHaveBeenCalledWith('ai-stream', {
      content: 'chunk1',
      done: false,
      state: 'THINKING',
    });
    expect(mockSocket.emit).toHaveBeenCalledWith('ai-stream', {
      content: 'chunk2',
      done: true,
      state: 'IDLE',
    });
  });
});
