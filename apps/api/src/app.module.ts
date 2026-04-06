import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { APP_GUARD } from '@nestjs/core';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { ThrottlerRedisModule } from '@/throttler/throttler-redis.module';
import { RedisThrottlerStorage } from '@/redis/redis-throttler.storage';
import configuration from './config/configuration';
import { validateEnv } from './config/env.validation';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { ProfilesModule } from './profiles/profiles.module';
import { DiscoveryModule } from './discovery/discovery.module';
import { SwipesModule } from './swipes/swipes.module';
import { MatchesModule } from './matches/matches.module';
import { MessagingModule } from './messaging/messaging.module';
import { SubscriptionsModule } from './subscriptions/subscriptions.module';
import { NotificationsModule } from './notifications/notifications.module';
import { SafetyModule } from './safety/safety.module';
import { AdminModule } from './admin/admin.module';
import { HealthModule } from './health/health.module';
import { PublicConfigModule } from './config/public-config.module';
import { AppSettingsModule } from './app-settings/app-settings.module';
import { StorageModule } from './storage/storage.module';
import { PushModule } from './push/push.module';
import { MembershipModule } from './membership/membership.module';
import { ChatModule } from './chat/chat.module';
import { RedisModule } from './redis/redis.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      validate: validateEnv,
    }),
    RedisModule,
    EventEmitterModule.forRoot({ wildcard: false, delimiter: '.' }),
    ThrottlerModule.forRootAsync({
      imports: [ThrottlerRedisModule],
      inject: [RedisThrottlerStorage],
      useFactory: (storage: RedisThrottlerStorage) => ({
        throttlers: [
          { name: 'short', ttl: 1000, limit: 30 },
          { name: 'medium', ttl: 60000, limit: 200 },
        ],
        storage,
      }),
    }),
    PrismaModule,
    MembershipModule,
    AppSettingsModule,
    StorageModule,
    PushModule,
    AuthModule,
    UsersModule,
    ProfilesModule,
    DiscoveryModule,
    SwipesModule,
    MatchesModule,
    MessagingModule,
    SubscriptionsModule,
    NotificationsModule,
    SafetyModule,
    AdminModule,
    HealthModule,
    PublicConfigModule,
    ChatModule,
  ],
  providers: [
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_GUARD, useClass: JwtAuthGuard },
  ],
})
export class AppModule {}
