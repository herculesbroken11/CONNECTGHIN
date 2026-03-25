import { Controller, Get, Post, Req, RawBodyRequest } from '@nestjs/common';
import { Request } from 'express';
import { SubscriptionsService } from './subscriptions.service';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { JwtPayload } from '@/auth/types/jwt-payload.type';
import { Public } from '@/common/decorators/public.decorator';

@Controller('subscriptions')
export class SubscriptionsController {
  constructor(private readonly subscriptions: SubscriptionsService) {}

  @Get('me')
  me(@CurrentUser() user: JwtPayload) {
    return this.subscriptions.getMine(user.sub);
  }

  @Post('checkout-session')
  checkout(@CurrentUser() user: JwtPayload) {
    return this.subscriptions.createCheckoutSession(user.sub);
  }

  @Post('customer-portal')
  portal(@CurrentUser() user: JwtPayload) {
    return this.subscriptions.createPortalSession(user.sub);
  }

  @Public()
  @Post('webhook')
  webhook(@Req() req: RawBodyRequest<Request>) {
    return this.subscriptions.handleWebhook(req);
  }

  @Post('cancel')
  cancel(@CurrentUser() user: JwtPayload) {
    return this.subscriptions.cancel(user.sub);
  }

  @Post('resume')
  resume(@CurrentUser() user: JwtPayload) {
    return this.subscriptions.resume(user.sub);
  }
}
