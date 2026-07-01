import { Injectable, Logger } from '@nestjs/common';
import { Observable, interval } from 'rxjs';
import { concatMap, share } from 'rxjs/operators';
import * as si from 'systeminformation';

export interface SystemMetrics {
  cpu: number;
  ram: number;
}

@Injectable()
export class SystemMonitorService {
  private readonly logger = new Logger(SystemMonitorService.name);

  public readonly metrics$: Observable<SystemMetrics> = interval(1000).pipe(
    concatMap(async () => {
      try {
        const [cpuData, memData] = await Promise.all([
          si.currentLoad(),
          si.mem(),
        ]);
        const cpu = cpuData.currentLoad;
        const ram = memData.total > 0 ? (memData.active / memData.total) * 100 : 0;
        return { cpu, ram };
      } catch (error: any) {
        this.logger.error(`Error retrieving system metrics: ${error?.message || error}`);
        return { cpu: 0, ram: 0 };
      }
    }),
    share()
  );
}
