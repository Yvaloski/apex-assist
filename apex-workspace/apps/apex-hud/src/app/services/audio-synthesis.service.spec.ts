import { TestBed } from '@angular/core/testing';
import { AudioSynthesisService } from './audio-synthesis.service';

describe('AudioSynthesisService', () => {
  let service: AudioSynthesisService;
  let mockOscillator: any;
  let mockGain: any;
  let mockAudioContext: any;

  beforeEach(() => {
    mockOscillator = {
      type: 'sine',
      frequency: {
        setValueAtTime: jest.fn(),
        exponentialRampToValueAtTime: jest.fn(),
      },
      connect: jest.fn(),
      start: jest.fn(),
      stop: jest.fn(),
    };

    mockGain = {
      gain: {
        setValueAtTime: jest.fn(),
        linearRampToValueAtTime: jest.fn(),
        exponentialRampToValueAtTime: jest.fn(),
      },
      connect: jest.fn(),
    };

    mockAudioContext = {
      state: 'suspended',
      currentTime: 10,
      resume: jest.fn().mockResolvedValue(undefined),
      createOscillator: jest.fn(() => mockOscillator),
      createGain: jest.fn(() => mockGain),
      destination: {},
    };

    (window as any).AudioContext = jest.fn(() => mockAudioContext);

    TestBed.configureTestingModule({
      providers: [AudioSynthesisService],
    });
    service = TestBed.inject(AudioSynthesisService);
  });

  afterEach(() => {
    delete (window as any).AudioContext;
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should play listening chirp', () => {
    service.playListeningChirp();
    expect(mockAudioContext.createOscillator).toHaveBeenCalled();
    expect(mockAudioContext.createGain).toHaveBeenCalled();
    expect(mockOscillator.start).toHaveBeenCalled();
  });

  it('should play thinking tone', () => {
    service.playThinkingTone();
    expect(mockAudioContext.createOscillator).toHaveBeenCalled();
    expect(mockAudioContext.createGain).toHaveBeenCalled();
    expect(mockOscillator.start).toHaveBeenCalled();
  });

  it('should play confirm chime', () => {
    service.playConfirmChime();
    expect(mockAudioContext.createOscillator).toHaveBeenCalled();
    expect(mockAudioContext.createGain).toHaveBeenCalled();
    expect(mockOscillator.start).toHaveBeenCalled();
  });
});
