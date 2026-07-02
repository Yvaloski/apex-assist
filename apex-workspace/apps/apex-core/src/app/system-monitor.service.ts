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
      // 1. RAM: Use native OS total/free memory (works on Windows instantly)
      const totalMem = os.totalmem();
      const freeMem = os.freemem();
      const usedMem = totalMem - freeMem;
      const ram = totalMem > 0 ? (usedMem / totalMem) * 100 : 0;
      const ramTotal = totalMem / (1024 * 1024 * 1024);
      const ramUsed = usedMem / (1024 * 1024 * 1024);

      // 2. CPU Speed
      const cpus = os.cpus();
      const cpuSpeed = cpus && cpus.length > 0 ? cpus[0].speed / 1000 : 4.0;

      // 3. CPU Load, Temp, and Active Processes with fallbacks
      return from(Promise.all([
        si.currentLoad(),
        si.cpuTemperature().catch(() => ({ main: 0 })),
        si.processes().catch(() => ({ list: [] }))
      ])).pipe(
        timeout(900),
        concatMap(([cpuData, tempData, processData]) => {
          this.lastCpu = cpuData.currentLoad;
          const cpuTemp = tempData.main || 48.0;
          const rawLoad = os.loadavg()[0];
          const cpuLoadAvg = rawLoad > 0 ? rawLoad : (this.lastCpu * cpus.length) / 100 || 0.5;

          const topProcesses = (processData.list || [])
            .sort((a, b) => b.cpu - a.cpu)
            .slice(0, 5)
            .map(p => ({
              pid: p.pid,
              name: p.name,
              cpu: p.cpu,
              mem: p.mem
            }));

          return of({
            cpu: this.lastCpu,
            ram,
            cpuSpeed,
            cpuTemp,
            cpuLoadAvg,
            ramTotal,
            ramUsed,
            topProcesses
          });
        }),
        catchError((error) => {
          this.logger.debug(`CPU metrics timeout/error: ${error?.message || error}. Using fallback.`);
          const rawLoad = os.loadavg()[0];
          const cpuLoadAvg = rawLoad > 0 ? rawLoad : (this.lastCpu * cpus.length) / 100 || 0.5;
          return of({
            cpu: this.lastCpu,
            ram,
            cpuSpeed,
            cpuTemp: 48.0,
            cpuLoadAvg,
            ramTotal,
            ramUsed,
            topProcesses: []
          });
        })
      );
    })
  );
}
