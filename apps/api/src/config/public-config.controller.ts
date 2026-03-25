import { Controller, Get } from '@nestjs/common';
import { Public } from '@/common/decorators/public.decorator';
import { AppSettingsService } from '@/app-settings/app-settings.service';

@Controller('config')
export class PublicConfigController {
  constructor(private readonly settings: AppSettingsService) {}

  @Public()
  @Get('public')
  async publicConfig() {
    const settings = await this.settings.allPublic();
    return {
      appName: 'ConnectGHIN',
      tagline: 'Where Golfers Connect',
      business: {
        premiumMonthlyUsd: 2.99,
        currency: 'USD',
      },
      settings,
    };
  }
}
