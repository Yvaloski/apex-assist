import { TestBed } from '@angular/core/testing';
import { SpeechRecognitionService } from './speech-recognition.service';
import { ApexStateService } from './apex-state.service';

describe('SpeechRecognitionService', () => {
  let service: SpeechRecognitionService;
  let mockStateService: jest.Mocked<any>;
  let mockRecognitionInstance: any;

  beforeEach(() => {
    mockStateService = {
      setState: jest.fn(),
      sendPrompt: jest.fn(),
      setResponse: jest.fn(),
      state: jest.fn(() => 'IDLE'),
    };

    mockRecognitionInstance = {
      start: jest.fn(),
      stop: jest.fn(),
      continuous: false,
      interimResults: false,
      lang: 'en-US',
      onresult: null,
      onerror: null,
      onend: null,
    };

    // Mock window.SpeechRecognition
    (window as any).SpeechRecognition = jest.fn(() => mockRecognitionInstance);
    (window as any).webkitSpeechRecognition = undefined;

    TestBed.configureTestingModule({
      providers: [
        { provide: ApexStateService, useValue: mockStateService },
      ],
    });

    service = TestBed.inject(SpeechRecognitionService);
  });

  afterEach(() => {
    delete (window as any).SpeechRecognition;
    delete (window as any).webkitSpeechRecognition;
  });

  it('should be created and check browser support', () => {
    expect(service).toBeTruthy();
    expect(service.isSupported()).toBe(true);
  });

  it('should not support if both SpeechRecognition classes are undefined', () => {
    delete (window as any).SpeechRecognition;
    delete (window as any).webkitSpeechRecognition;
    expect(service.isSupported()).toBe(false);
  });

  it('should transition state to LISTENING and call start on recognition when start is called', () => {
    service.start();
    expect(mockStateService.setState).toHaveBeenCalledWith('LISTENING');
    expect(mockRecognitionInstance.start).toHaveBeenCalled();
  });

  it('should call stop on recognition when stop is called', () => {
    service.start(); // to set listening state
    service.stop();
    expect(mockRecognitionInstance.stop).toHaveBeenCalled();
  });

  it('should call sendPrompt and update state when speech recognition results in success', () => {
    service.start();

    // Trigger onresult handler
    const mockEvent = {
      results: [
        [{ transcript: 'execute query' }]
      ]
    };
    mockRecognitionInstance.onresult(mockEvent);

    expect(mockStateService.sendPrompt).toHaveBeenCalledWith('execute query');
  });

  it('should reset listening state and transition state to IDLE on error', () => {
    service.start();

    // Trigger onerror handler
    mockRecognitionInstance.onerror({ error: 'no-speech' });

    expect(mockStateService.setState).toHaveBeenCalledWith('IDLE');
  });

  it('should transition state to IDLE on end if state was LISTENING', () => {
    service.start();
    // Simulate that state is still LISTENING
    mockStateService.state.mockReturnValue('LISTENING');

    // Trigger onend handler
    mockRecognitionInstance.onend();

    expect(mockStateService.setState).toHaveBeenCalledWith('IDLE');
  });

  it('should allow setting and getting language', () => {
    service.setLanguage('en-US');
    expect(service.getLanguage()).toBe('en-US');
  });

  it('should run diagnostics and return a detailed report', async () => {
    const report = await service.runDiagnostics();
    expect(report).toBeDefined();
    expect(report.supported).toBe(true);
  });
});
