import { Injectable, Logger } from '@nestjs/common';
import { Observable, interval, from, of } from 'rxjs';
import { concatMap, timeout, catchError } from 'rxjs/operators';
import * as si from 'systeminformation';
import * as os from 'os';

export interface SystemMetrics {
  cpu: number;
  ram: number;
}

@Injectable()
export class SystemMonitorService {
  private readonly logger = new Logger(SystemMonitorService.name);
  private lastCpu = 12.5;

  public readonly metrics$: Observable<SystemMetrics> = interval(1000).pipe(
    concatMap(() => {
      // 1. RAM: Use native OS total/free memory (works on Windows instantly without WMI queries)
      const totalMem = os.totalmem();
      const freeMem = os.freemem();
      const usedMem = totalMem - freeMem;
      const ram = totalMem > 0 ? (usedMem / totalMem) * 100 : 0;

      // 2. CPU: Fetch system load with a timeout fallback to prevent WMI hangs
      return from(si.currentLoad()).pipe(
        timeout(800),
        concatMap((cpuData) => {
          this.lastCpu = cpuData.currentLoad;
          return of({ cpu: this.lastCpu, ram });
        }),
        catchError((error) => {
          this.logger.debug(`CPU metrics timeout/error: ${error?.message || error}. Using last value.`);
          return of({ cpu: this.lastCpu, ram });
        })
      );
    })
  );
}
