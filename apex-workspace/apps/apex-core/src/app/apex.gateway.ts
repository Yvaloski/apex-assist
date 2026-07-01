import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';
import { SystemMonitorService } from './system-monitor.service';
import { AiService } from './ai.service';
import { Subscription } from 'rxjs';
import { ApexStreamChunk } from '@apex-workspace/shared-interfaces';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class ApexGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server!: Server;

  private readonly logger = new Logger(ApexGateway.name);
  private metricsSubscription?: Subscription;

  constructor(
    private readonly systemMonitorService: SystemMonitorService,
    private readonly aiService: AiService
  ) {}

  /**
   * Called when a client establishes a connection.
   */
  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);

    // If this is the first client, start the metrics subscription
    if (!this.metricsSubscription) {
      this.logger.log('Starting system metrics broadcast interval.');
      this.metricsSubscription = this.systemMonitorService.metrics$.subscribe({
        next: (metrics) => {
          this.server.emit('system-metrics', metrics);
        },
        error: (err) => {
          this.logger.error('Error in metrics subscription:', err);
        },
      });
    }
  }

  /**
   * Called when a client disconnects.
   */
  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);

    // Stop the metrics subscription if no clients are left
    const connectedClients = this.server?.sockets?.sockets?.size || 0;
    if (connectedClients === 0 && this.metricsSubscription) {
      this.logger.log('No clients connected. Stopping system metrics broadcast.');
      this.metricsSubscription.unsubscribe();
      this.metricsSubscription = undefined;
    }
  }

  /**
   * Handles incoming prompt requests and streams responses back to the requesting client.
   */
  @SubscribeMessage('prompt')
  handlePrompt(
    @MessageBody() data: { prompt: string },
    @ConnectedSocket() client: Socket
  ) {
    const prompt = data?.prompt;
    if (!prompt) {
      this.logger.warn(`Received empty prompt request from client ${client.id}`);
      client.emit('stream-error', { error: 'Prompt is required' });
      return;
    }

    this.logger.log(`Received prompt from client ${client.id}: "${prompt}"`);

    const subscription = this.aiService.generate(prompt).subscribe({
      next: (chunk: ApexStreamChunk) => {
        client.emit('ai-stream', chunk);
      },
      error: (err) => {
        this.logger.error(`Error in stream generation for client ${client.id}: ${err?.message || err}`);
        client.emit('stream-error', { error: err?.message || 'AI Generation error' });
      },
      complete: () => {
        this.logger.log(`Prompt response stream completed for client ${client.id}`);
      },
    });

    // Ensure the stream is cancelled if the client disconnects mid-generation
    client.once('disconnect', () => {
      subscription.unsubscribe();
    });
  }
}
