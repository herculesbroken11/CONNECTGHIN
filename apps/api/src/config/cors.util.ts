import { ConfigService } from '@nestjs/config';

/**
 * HTTP and Socket.IO share the same allowlist. In production, CORS_ORIGINS is required.
 */
export function buildCorsOrigin(config: ConfigService): boolean | string[] {
  const nodeEnv = config.get<string>('NODE_ENV') ?? 'development';
  const raw = config.get<string>('CORS_ORIGINS') ?? '';
  const origins = raw
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  if (nodeEnv === 'production') {
    if (!origins.length) {
      throw new Error(
        'CORS_ORIGINS must be set to a comma-separated allowlist in production',
      );
    }
    return origins;
  }
  return origins.length ? origins : true;
}
