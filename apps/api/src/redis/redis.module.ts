import { Global, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

export const REDIS_CLIENT = Symbol('REDIS_CLIENT');

@Global()
@Module({
  imports: [ConfigModule],
  providers: [
    {
      provide: REDIS_CLIENT,
      useFactory: (config: ConfigService): Redis | null => {
        const url = config.get<string>('REDIS_URL');
        if (!url?.length) return null;
        const client = new Redis(url, {
          lazyConnect: true,
          maxRetriesPerRequest: 3,
          // No Redis on host: stop reconnect spam; throttler falls back to memory.
          retryStrategy: () => null,
        });
        client.on('error', () => {
          /* handled in RedisThrottlerStorage.increment; avoids unhandled 'error' events */
        });
        return client;
      },
      inject: [ConfigService],
    },
  ],
  exports: [REDIS_CLIENT],
})
export class RedisModule {}
