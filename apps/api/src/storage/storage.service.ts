import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { existsSync, mkdirSync } from 'fs';
import { writeFile, readFile } from 'fs/promises';
import { join } from 'path';
import { randomUUID } from 'crypto';
import type { Express } from 'express';
import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
} from '@aws-sdk/client-s3';

const ALLOWED_MIME = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
]);
const MAX_BYTES = 5 * 1024 * 1024;

@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);
  private s3: S3Client | null = null;

  constructor(private readonly config: ConfigService) {
    const bucket = this.config.get<string>('S3_BUCKET');
    const access = this.config.get<string>('S3_ACCESS_KEY_ID');
    const secret = this.config.get<string>('S3_SECRET_ACCESS_KEY');
    if (bucket && access && secret) {
      this.s3 = new S3Client({
        region: this.config.get<string>('S3_REGION') ?? 'us-east-1',
        endpoint: this.config.get<string>('S3_ENDPOINT') || undefined,
        forcePathStyle: !!this.config.get<string>('S3_ENDPOINT'),
        credentials: { accessKeyId: access, secretAccessKey: secret },
      });
    }
  }

  getUploadDir(): string {
    const dir = join(process.cwd(), 'uploads');
    if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
    return dir;
  }

  usesS3(): boolean {
    return !!this.s3 && !!this.config.get<string>('S3_BUCKET');
  }

  async saveProfileImageBuffer(
    buffer: Buffer,
    mimetype: string,
  ): Promise<string> {
    if (!ALLOWED_MIME.has(mimetype)) {
      throw new BadRequestException('Invalid image type');
    }
    if (buffer.length > MAX_BYTES) {
      throw new BadRequestException('File too large');
    }
    const ext =
      mimetype === 'image/png' ? 'png' : mimetype === 'image/webp' ? 'webp' : 'jpg';
    const name = `${randomUUID()}.${ext}`;

    if (this.usesS3() && this.s3) {
      const bucket = this.config.getOrThrow<string>('S3_BUCKET');
      const key = `profiles/${name}`;
      await this.s3.send(
        new PutObjectCommand({
          Bucket: bucket,
          Key: key,
          Body: buffer,
          ContentType: mimetype,
        }),
      );
      const base =
        this.config.get<string>('S3_PUBLIC_BASE_URL')?.replace(/\/$/, '') ?? '';
      if (base) {
        return `${base}/${key}`;
      }
      return `s3://${bucket}/${key}`;
    }

    const dest = join(this.getUploadDir(), name);
    await writeFile(dest, buffer);
    return `/uploads/${name}`;
  }

  async saveProfileImage(file: Express.Multer.File): Promise<string> {
    if (!file?.mimetype || !ALLOWED_MIME.has(file.mimetype)) {
      throw new BadRequestException('Invalid image type');
    }
    if (file.size > MAX_BYTES) {
      throw new BadRequestException('File too large');
    }
    const sourcePath = file.path;
    if (!sourcePath) {
      throw new BadRequestException('Invalid upload');
    }
    const buf = await readFile(sourcePath);
    return this.saveProfileImageBuffer(buf, file.mimetype);
  }

  async deleteProfileObject(imageUrl: string): Promise<void> {
    if (imageUrl.startsWith('s3://')) {
      const rest = imageUrl.slice('s3://'.length);
      const slash = rest.indexOf('/');
      if (slash > 0 && this.s3) {
        const bucket = rest.slice(0, slash);
        const key = rest.slice(slash + 1);
        await this.s3
          .send(new DeleteObjectCommand({ Bucket: bucket, Key: key }))
          .catch((e) => this.logger.warn(`S3 delete: ${e}`));
      }
      return;
    }
    const base = this.config.get<string>('S3_PUBLIC_BASE_URL')?.replace(/\/$/, '');
    if (base && imageUrl.startsWith(base)) {
      const key = imageUrl.slice(base.length + 1);
      const bucket = this.config.get<string>('S3_BUCKET');
      if (bucket && this.s3) {
        await this.s3
          .send(new DeleteObjectCommand({ Bucket: bucket, Key: key }))
          .catch((e) => this.logger.warn(`S3 delete: ${e}`));
      }
    }
  }

  publicUrl(relativePath: string): string {
    if (relativePath.startsWith('http') || relativePath.startsWith('s3://')) {
      return relativePath;
    }
    const base = this.config.get<string>('APP_PUBLIC_URL') ?? '';
    return `${base.replace(/\/$/, '')}${relativePath}`;
  }
}
