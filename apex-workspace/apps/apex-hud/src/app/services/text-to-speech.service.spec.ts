import { TestBed } from '@angular/core/testing';
import { TextToSpeechService } from './text-to-speech.service';

describe('TextToSpeechService', () => {
  let service: TextToSpeechService;
  let mockSpeechSynthesis: any;
  let mockUtteranceClass: any;

  beforeEach(() => {
    mockSpeechSynthesis = {
      speak: jest.fn(),
      cancel: jest.fn(),
      getVoices: jest.fn().mockReturnValue([]),
    };

    mockUtteranceClass = jest.fn().mockImplementation((text) => ({
      text,
      rate: 1.0,
      pitch: 1.0,
    }));

    (window as any).speechSynthesis = mockSpeechSynthesis;
    (window as any).SpeechSynthesisUtterance = mockUtteranceClass;

    TestBed.configureTestingModule({
      providers: [TextToSpeechService],
    });
    service = TestBed.inject(TextToSpeechService);
  });

  afterEach(() => {
    delete (window as any).speechSynthesis;
    delete (window as any).SpeechSynthesisUtterance;
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should speak direct text', () => {
    service.speak('Hello world');
    expect(mockSpeechSynthesis.cancel).toHaveBeenCalled();
    expect(mockSpeechSynthesis.speak).toHaveBeenCalled();
    expect(mockUtteranceClass).toHaveBeenCalledWith('Hello world');
  });

  it('should cancel speech and clear buffer', () => {
    service.cancel();
    expect(mockSpeechSynthesis.cancel).toHaveBeenCalled();
  });

  it('should process feedChunk and speak only on full sentences', () => {
    service.feedChunk('Hello');
    expect(mockSpeechSynthesis.speak).not.toHaveBeenCalled();

    service.feedChunk(' world. Next sentence');
    expect(mockSpeechSynthesis.speak).toHaveBeenCalledTimes(1);
    expect(mockUtteranceClass).toHaveBeenCalledWith('Hello world.');

    service.flush();
    expect(mockSpeechSynthesis.speak).toHaveBeenCalledTimes(2);
    expect(mockUtteranceClass).toHaveBeenCalledWith('Next sentence');
  });

  it('should run diagnostics and return a detailed report', () => {
    const report = service.runDiagnostics();
    expect(report).toBeDefined();
    expect(report.supported).toBe(true);
    expect(report.isMuted).toBe(false);
  });
});
