import { Test, TestingModule } from '@nestjs/testing';
import { SystemMonitorService } from './system-monitor.service';
import * as si from 'systeminformation';

jest.mock('systeminformation', () => ({
  currentLoad: jest.fn().mockResolvedValue({ currentLoad: 25.5 }),
  mem: jest.fn().mockResolvedValue({ active: 4000, total: 16000 }),
}));

describe('SystemMonitorService', () => {
  let service: SystemMonitorService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SystemMonitorService],
    }).compile();

    service = module.get<SystemMonitorService>(SystemMonitorService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should emit correct cpu and ram metrics', (done) => {
    service.metrics$.subscribe({
      next: (metrics) => {
        expect(metrics.cpu).toBe(25.5);
        expect(metrics.ram).toBe(25); // (4000 / 16000) * 100
        done();
      },
      error: (err) => {
        done(err);
      },
    });
  });
});
