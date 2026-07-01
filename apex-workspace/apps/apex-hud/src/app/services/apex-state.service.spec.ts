import { TestBed } from '@angular/core/testing';
import { ApexStateService } from './apex-state.service';
import { ApexWebSocketService } from './apex-websocket.service';
import { AudioSynthesisService } from './audio-synthesis.service';
import { TextToSpeechService } from './text-to-speech.service';
import { Subject } from 'rxjs';
import { ApexStreamChunk, SystemMetrics } from '@apex-workspace/shared-interfaces';

describe('ApexStateService', () => {
  let service: ApexStateService;
  let mockWsService: jest.Mocked<any>;
  let mockAudioService: jest.Mocked<any>;
  let mockTtsService: jest.Mocked<any>;

  let metricsSubject: Subject<SystemMetrics>;
  let aiStreamSubject: Subject<ApexStreamChunk>;
  let streamErrorSubject: Subject<{ error: string }>;

  beforeEach(() => {
    metricsSubject = new Subject<SystemMetrics>();
    aiStreamSubject = new Subject<ApexStreamChunk>();
    streamErrorSubject = new Subject<{ error: string }>();

    mockWsService = {
      getSystemMetrics: jest.fn(() => metricsSubject.asObservable()),
      getAiStream: jest.fn(() => aiStreamSubject.asObservable()),
      getStreamError: jest.fn(() => streamErrorSubject.asObservable()),
      sendPrompt: jest.fn(),
      sendStateChange: jest.fn(),
    };

    mockAudioService = {
      playListeningChirp: jest.fn(),
      playThinkingTone: jest.fn(),
      playConfirmChime: jest.fn(),
    };

    mockTtsService = {
      cancel: jest.fn(),
      feedChunk: jest.fn(),
      flush: jest.fn(),
      speak: jest.fn(),
    };

    TestBed.configureTestingModule({
      providers: [
        { provide: ApexWebSocketService, useValue: mockWsService },
        { provide: AudioSynthesisService, useValue: mockAudioService },
        { provide: TextToSpeechService, useValue: mockTtsService },
      ],
    });

    service = TestBed.inject(ApexStateService);
  });

  it('should be created and have default states', () => {
    expect(service).toBeTruthy();
    expect(service.state()).toBe('IDLE');
    expect(service.currentResponse()).toBe('');
    expect(service.systemMetrics()).toEqual({ cpu: 0, ram: 0 });
  });

  it('should update state and call sendStateChange/sfx when setState is called', () => {
    service.setState('LISTENING');
    expect(service.state()).toBe('LISTENING');
    expect(mockWsService.sendStateChange).toHaveBeenCalledWith('LISTENING');
    expect(mockTtsService.cancel).toHaveBeenCalled();
    expect(mockAudioService.playListeningChirp).toHaveBeenCalled();
  });

  it('should clear response, set state to THINKING, and call sendPrompt/sfx when sendPrompt is called', () => {
    // Send some mock content first to verify currentResponse gets cleared
    aiStreamSubject.next({ content: 'previous text', done: false });
    expect(service.currentResponse()).toBe('previous text');

    service.sendPrompt('new prompt');
    expect(service.currentResponse()).toBe('');
    expect(service.state()).toBe('THINKING');
    expect(mockWsService.sendPrompt).toHaveBeenCalledWith('new prompt');
    expect(mockTtsService.cancel).toHaveBeenCalled();
    expect(mockAudioService.playThinkingTone).toHaveBeenCalled();
  });

  it('should update systemMetrics when WS service emits new metrics', () => {
    metricsSubject.next({ cpu: 25, ram: 60 });
    expect(service.systemMetrics()).toEqual({ cpu: 25, ram: 60 });
  });

  it('should accumulate response content, feed TTS, and trigger confirm chime on completion', () => {
    aiStreamSubject.next({ content: 'Hello ', done: false, state: 'THINKING' });
    expect(service.currentResponse()).toBe('Hello ');
    expect(service.state()).toBe('THINKING');
    expect(mockTtsService.feedChunk).toHaveBeenCalledWith('Hello ');

    aiStreamSubject.next({ content: 'world!', done: true, state: 'IDLE' });
    expect(service.currentResponse()).toBe('Hello world!');
    expect(service.state()).toBe('IDLE');
    expect(mockTtsService.feedChunk).toHaveBeenCalledWith('world!');
    expect(mockTtsService.flush).toHaveBeenCalled();
    expect(mockAudioService.playConfirmChime).toHaveBeenCalled();
  });

  it('should reset state to IDLE and trigger confirm chime when a stream error occurs', () => {
    service.setState('THINKING');
    // Clear mock calls to verify error triggers
    mockAudioService.playConfirmChime.mockClear();

    streamErrorSubject.next({ error: 'Failed' });
    expect(service.state()).toBe('IDLE');
    expect(mockAudioService.playConfirmChime).toHaveBeenCalled();
  });
});

