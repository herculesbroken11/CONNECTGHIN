import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { ThrottlerStorage } from '@nestjs/throttler/dist/throttler-storage.interface';
import { ThrottlerStorageRecord } from '@nestjs/throttler/dist/throttler-storage-record.interface';
import type Redis from 'ioredis';
import { Inject } from '@nestjs/common';
import { REDIS_CLIENT } from './redis.module';

type MemEntry = { hits: number; resetAt: number; blockUntil: number };

/**
 * Distributed fixed-window limits via Redis when REDIS_URL is set;
 * otherwise in-memory map (single Node process only).
 */
@Injectable()
export class RedisThrottlerStorage
  implements ThrottlerStorage, OnModuleDestroy
{
  private readonly logger = new Logger(RedisThrottlerStorage.name);
  private readonly memory = new Map<string, MemEntry>();
  /** After first Redis failure, use memory only (avoids log spam when Redis is down). */
  private redisThrottlerDown = false;

  constructor(@Inject(REDIS_CLIENT) private readonly redis: Redis | null) {}

  async increment(
    key: string,
    ttl: number,
    limit: number,
    blockDuration: number,
    throttlerName: string,
  ): Promise<ThrottlerStorageRecord> {
    const fullKey = `${throttlerName}:${key}`;
    if (!this.redis || this.redisThrottlerDown) {
      return this.memoryIncrement(fullKey, ttl, limit, blockDuration);
    }

    const rk = `cg:th:${throttlerName}:${key}`;
    const blk = `${rk}:block`;

    try {
      const blockTtl = await this.redis.pttl(blk);
      if (blockTtl > 0) {
        const winTtl = await this.redis.pttl(rk);
        return {
          totalHits: limit + 1,
          timeToExpire: Math.max(0, Math.ceil(winTtl / 1000)),
          isBlocked: true,
          timeToBlockExpire: Math.ceil(blockTtl / 1000),
        };
      }

      const hits = await this.redis.incr(rk);
      if (hits === 1) {
        await this.redis.pexpire(rk, ttl);
      }
      const pttl = await this.redis.pttl(rk);
      const timeToExpire = Math.max(0, Math.ceil(pttl / 1000));

      if (hits > limit) {
        await this.redis.psetex(blk, blockDuration, '1');
        await this.redis.del(rk);
        return {
          totalHits: hits,
          timeToExpire,
          isBlocked: true,
          timeToBlockExpire: Math.ceil(blockDuration / 1000),
        };
      }

      return {
        totalHits: hits,
        timeToExpire,
        isBlocked: false,
        timeToBlockExpire: 0,
      };
    } catch (e) {
      const msg = (e as Error).message;
      if (!this.redisThrottlerDown) {
        this.redisThrottlerDown = true;
        this.logger.warn(
          `Redis throttler unavailable (using in-memory limits until restart): ${msg}`,
        );
      }
      return this.memoryIncrement(fullKey, ttl, limit, blockDuration);
    }
  }

  private memoryIncrement(
    fullKey: string,
    ttl: number,
    limit: number,
    blockDuration: number,
  ): ThrottlerStorageRecord {
    const now = Date.now();
    let e = this.memory.get(fullKey);
    if (!e || now >= e.resetAt) {
      e = { hits: 0, resetAt: now + ttl, blockUntil: 0 };
    }
    if (e.blockUntil > now) {
      return {
        totalHits: limit + 1,
        timeToExpire: Math.max(0, Math.ceil((e.resetAt - now) / 1000)),
        isBlocked: true,
        timeToBlockExpire: Math.ceil((e.blockUntil - now) / 1000),
      };
    }
    e.hits += 1;
    this.memory.set(fullKey, e);
    const timeToExpire = Math.max(0, Math.ceil((e.resetAt - now) / 1000));
    if (e.hits > limit) {
      e.blockUntil = now + blockDuration;
      e.hits = 0;
      e.resetAt = now + ttl;
      return {
        totalHits: limit + 1,
        timeToExpire,
        isBlocked: true,
        timeToBlockExpire: Math.ceil(blockDuration / 1000),
      };
    }
    return {
      totalHits: e.hits,
      timeToExpire,
      isBlocked: false,
      timeToBlockExpire: 0,
    };
  }

  async onModuleDestroy() {
    if (this.redis) {
      await this.redis.quit().catch(() => undefined);
    }
  }
}
