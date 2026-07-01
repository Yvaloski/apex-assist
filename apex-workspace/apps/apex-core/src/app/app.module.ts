import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ApexGateway } from './apex.gateway';
import { SystemMonitorService } from './system-monitor.service';
import { AiService } from './ai.service';

@Module({
  imports: [],
  controllers: [AppController],
  providers: [AppService, ApexGateway, SystemMonitorService, AiService],
})
export class AppModule {}
