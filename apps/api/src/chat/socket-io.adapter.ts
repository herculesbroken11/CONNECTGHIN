import { INestApplicationContext } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { IoAdapter } from '@nestjs/platform-socket.io';
import { buildCorsOrigin } from '@/config/cors.util';
import type { ServerOptions } from 'socket.io';

export class SocketIoAdapter extends IoAdapter {
  constructor(private readonly nestApp: INestApplicationContext) {
    super(nestApp);
  }

  createIOServer(port: number, options?: ServerOptions): unknown {
    const config = this.nestApp.get(ConfigService);
    const origin = buildCorsOrigin(config);
    return super.createIOServer(port, {
      ...options,
      cors: { origin, credentials: true },
    });
  }
}
