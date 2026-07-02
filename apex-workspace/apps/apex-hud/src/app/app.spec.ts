import { TestBed } from '@angular/core/testing';
import { App } from './app';
import { ApexWebSocketService } from './services/apex-websocket.service';
import { Subject } from 'rxjs';
import { ApexStreamChunk, SystemMetrics } from '@apex-workspace/shared-interfaces';

describe('App', () => {
  let mockWsService: jest.Mocked<any>;
  let metricsSubject: Subject<SystemMetrics>;
  let aiStreamSubject: Subject<ApexStreamChunk>;
  let streamErrorSubject: Subject<{ error: string }>;

  beforeEach(async () => {
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

    // Mock speech recognition support
    (window as any).SpeechRecognition = jest.fn().mockImplementation(() => ({
      start: jest.fn(),
      stop: jest.fn(),
      continuous: false,
      interimResults: false,
      lang: 'en-US',
      onresult: null,
      onerror: null,
      onend: null,
    }));

    await TestBed.configureTestingModule({
      imports: [App],
      providers: [
        { provide: ApexWebSocketService, useValue: mockWsService },
      ],
    }).compileComponents();
  });

  afterEach(() => {
    delete (window as any).SpeechRecognition;
  });

  it('should render title', async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('h1')?.textContent).toContain(
      'APEX // DIGITAL_HUD',
    );
  });
});
