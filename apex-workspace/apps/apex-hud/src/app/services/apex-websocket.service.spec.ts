import { TestBed } from '@angular/core/testing';
import { ApexWebSocketService } from './apex-websocket.service';

const mockSocket = {
  on: jest.fn(),
  off: jest.fn(),
  emit: jest.fn(),
  disconnect: jest.fn(),
};

jest.mock('socket.io-client', () => ({
  io: jest.fn(() => mockSocket),
}));

describe('ApexWebSocketService', () => {
  let service: ApexWebSocketService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ApexWebSocketService);
    jest.clearAllMocks();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should emit prompt when sendPrompt is called', () => {
    service.sendPrompt('test prompt');
    expect(mockSocket.emit).toHaveBeenCalledWith('prompt', { prompt: 'test prompt' });
  });

  it('should emit state-change when sendStateChange is called', () => {
    service.sendStateChange('LISTENING');
    expect(mockSocket.emit).toHaveBeenCalledWith('state-change', { state: 'LISTENING' });
  });

  it('should call disconnect when disconnect is called', () => {
    service.disconnect();
    expect(mockSocket.disconnect).toHaveBeenCalled();
  });
});
