import {
  Injectable,
  BadRequestException,
  Logger,
  NotFoundException,
  RawBodyRequest,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '@/prisma/prisma.service';
import Stripe from 'stripe';
import { Request } from 'express';
import {
  BillingCycle,
  MembershipStatus,
  MembershipType,
  SubscriptionRecordStatus,
  SubscriptionProvider,
} from '@prisma/client';
import { AppSettingsService } from '@/app-settings/app-settings.service';

@Injectable()
export class SubscriptionsService {
  private readonly logger = new Logger(SubscriptionsService.name);
  private stripe: Stripe | null = null;

  constructor(
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
    private readonly appSettings: AppSettingsService,
  ) {
    const key = this.config.get<string>('STRIPE_SECRET_KEY');
    if (key) this.stripe = new Stripe(key);
  }

  private requireStripe(): Stripe {
    if (!this.stripe) throw new BadRequestException('Stripe not configured');
    return this.stripe;
  }

  async getMine(userId: string) {
    const sub = await this.prisma.subscription.findFirst({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        membershipType: true,
        membershipStatus: true,
      },
    });
    return { subscription: sub, membership: user };
  }

  async createCheckoutSession(userId: string) {
    const stripe = this.requireStripe();
    const priceId = this.config.get<string>('STRIPE_PRICE_MONTHLY_PREMIUM');
    if (!priceId) throw new BadRequestException('Premium price not configured');

    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException();

    let customerId: string | undefined;
    const existing = await this.prisma.subscription.findFirst({
      where: { userId, stripeCustomerId: { not: null } },
      orderBy: { createdAt: 'desc' },
    });
    if (existing?.stripeCustomerId) {
      customerId = existing.stripeCustomerId ?? undefined;
    } else {
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: { userId },
      });
      customerId = customer.id;
    }

    const trialDays = this.config.get<number>('STRIPE_TRIAL_DAYS') ?? 7;

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      customer: customerId,
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${this.config.get('APP_PUBLIC_URL')}/subscription/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${this.config.get('APP_PUBLIC_URL')}/subscription/cancel`,
      subscription_data: {
        trial_period_days: trialDays > 0 ? trialDays : undefined,
        metadata: { userId },
      },
      metadata: { userId },
    });

    return { url: session.url, sessionId: session.id };
  }

  async createPortalSession(userId: string) {
    const stripe = this.requireStripe();
    const sub = await this.prisma.subscription.findFirst({
      where: { userId, stripeCustomerId: { not: null } },
      orderBy: { createdAt: 'desc' },
    });
    if (!sub?.stripeCustomerId) {
      throw new BadRequestException('No billing account');
    }
    const portal = await stripe.billingPortal.sessions.create({
      customer: sub.stripeCustomerId,
      return_url: `${this.config.get('APP_PUBLIC_URL')}/settings`,
    });
    return { url: portal.url };
  }

  async cancel(userId: string) {
    const stripe = this.requireStripe();
    const sub = await this.prisma.subscription.findFirst({
      where: { userId, stripeSubscriptionId: { not: null } },
      orderBy: { createdAt: 'desc' },
    });
    if (!sub?.stripeSubscriptionId) {
      throw new BadRequestException('No active Stripe subscription');
    }
    await stripe.subscriptions.update(sub.stripeSubscriptionId, {
      cancel_at_period_end: true,
    });
    await this.prisma.subscription.update({
      where: { id: sub.id },
      data: { cancelAtPeriodEnd: true },
    });
    return { ok: true };
  }

  async resume(userId: string) {
    const stripe = this.requireStripe();
    const sub = await this.prisma.subscription.findFirst({
      where: { userId, stripeSubscriptionId: { not: null } },
      orderBy: { createdAt: 'desc' },
    });
    if (!sub?.stripeSubscriptionId) {
      throw new BadRequestException('No Stripe subscription');
    }
    await stripe.subscriptions.update(sub.stripeSubscriptionId, {
      cancel_at_period_end: false,
    });
    await this.prisma.subscription.update({
      where: { id: sub.id },
      data: { cancelAtPeriodEnd: false },
    });
    return { ok: true };
  }

  async handleWebhook(req: RawBodyRequest<Request>) {
    const stripe = this.requireStripe();
    const whSecret = this.config.get<string>('STRIPE_WEBHOOK_SECRET');
    if (!whSecret) throw new BadRequestException('Webhook not configured');

    const sig = req.headers['stripe-signature'];
    if (!sig || typeof sig !== 'string') {
      throw new BadRequestException('Missing signature');
    }

    const raw = req.rawBody;
    if (!raw) throw new BadRequestException('Raw body required');

    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(raw, sig, whSecret);
    } catch (err) {
      throw new BadRequestException(
        `Webhook signature verification failed: ${(err as Error).message}`,
      );
    }

    const dup = await this.prisma.paymentEvent.findUnique({
      where: { stripeEventId: event.id },
    });
    if (dup) return { received: true, duplicate: true };

    let logUserId: string | null = null;

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        logUserId = session.metadata?.userId ?? null;
        const sid = session.subscription;
        if (typeof sid === 'string' && logUserId) {
          await this.syncSubscriptionFromStripe(logUserId, sid);
        }
        break;
      }
      case 'customer.subscription.updated':
      case 'customer.subscription.deleted': {
        const sub = event.data.object as Stripe.Subscription;
        const row = await this.prisma.subscription.findUnique({
          where: { stripeSubscriptionId: sub.id },
        });
        logUserId =
          row?.userId ??
          (sub.metadata?.userId as string | undefined) ??
          null;
        if (!logUserId && typeof sub.customer === 'string') {
          logUserId = await this.userIdFromStripeCustomer(stripe, sub.customer);
        }
        if (logUserId) {
          await this.syncSubscriptionFromStripe(logUserId, sub.id);
        } else {
          this.logger.warn(
            `Stripe subscription ${sub.id}: could not resolve user; skipping sync`,
          );
        }
        break;
      }
      default:
        break;
    }

    if (logUserId) {
      await this.prisma.paymentEvent.create({
        data: {
          userId: logUserId,
          stripeEventId: event.id,
          eventType: event.type,
          payloadJson: JSON.stringify(event),
        },
      });
    }

    return { received: true };
  }

  private mapStripeStatus(
    s: Stripe.Subscription.Status,
  ): SubscriptionRecordStatus {
    const m: Record<string, SubscriptionRecordStatus> = {
      active: SubscriptionRecordStatus.ACTIVE,
      trialing: SubscriptionRecordStatus.TRIALING,
      past_due: SubscriptionRecordStatus.PAST_DUE,
      canceled: SubscriptionRecordStatus.CANCELED,
      incomplete: SubscriptionRecordStatus.INCOMPLETE,
      incomplete_expired: SubscriptionRecordStatus.INCOMPLETE_EXPIRED,
      unpaid: SubscriptionRecordStatus.UNPAID,
      paused: SubscriptionRecordStatus.PAUSED,
    };
    return m[s] ?? SubscriptionRecordStatus.INCOMPLETE;
  }

  private async syncSubscriptionFromStripe(userId: string, stripeSubId: string) {
    const stripe = this.requireStripe();
    const sub = await stripe.subscriptions.retrieve(stripeSubId);

    const customerId =
      typeof sub.customer === 'string' ? sub.customer : sub.customer.id;
    const priceId = sub.items.data[0]?.price?.id;
    const status = this.mapStripeStatus(sub.status);
    const trialStart = sub.trial_start
      ? new Date(sub.trial_start * 1000)
      : null;
    const trialEnd = sub.trial_end ? new Date(sub.trial_end * 1000) : null;
    const cps = sub.current_period_start
      ? new Date(sub.current_period_start * 1000)
      : null;
    const cpe = sub.current_period_end
      ? new Date(sub.current_period_end * 1000)
      : null;

    const amount = sub.items.data[0]?.price?.unit_amount ?? undefined;

    await this.prisma.subscription.upsert({
      where: { stripeSubscriptionId: stripeSubId },
      create: {
        userId,
        provider: SubscriptionProvider.STRIPE,
        stripeCustomerId: customerId,
        stripeSubscriptionId: stripeSubId,
        stripePriceId: priceId,
        planCode: 'premium_monthly',
        billingCycle: BillingCycle.MONTHLY,
        amount: amount ?? null,
        currency: sub.currency ?? 'usd',
        status,
        trialStartAt: trialStart,
        trialEndAt: trialEnd,
        currentPeriodStart: cps,
        currentPeriodEnd: cpe,
        cancelAtPeriodEnd: sub.cancel_at_period_end,
        canceledAt: sub.canceled_at
          ? new Date(sub.canceled_at * 1000)
          : null,
      },
      update: {
        userId,
        stripeCustomerId: customerId,
        stripePriceId: priceId,
        status,
        trialStartAt: trialStart,
        trialEndAt: trialEnd,
        currentPeriodStart: cps,
        currentPeriodEnd: cpe,
        cancelAtPeriodEnd: sub.cancel_at_period_end,
        canceledAt: sub.canceled_at
          ? new Date(sub.canceled_at * 1000)
          : null,
        amount: amount ?? undefined,
      },
    });

    await this.applyMembershipFromSubscription(userId, status);
    return { ok: true };
  }

  private async applyMembershipFromSubscription(
    userId: string,
    status: SubscriptionRecordStatus,
  ) {
    let membershipType: MembershipType = MembershipType.FREE;
    let membershipStatus: MembershipStatus = MembershipStatus.NONE;

    const trialingOk = await this.appSettings.premiumTrialingFeaturesEnabled();

    if (status === SubscriptionRecordStatus.ACTIVE) {
      membershipType = MembershipType.PREMIUM;
      membershipStatus = MembershipStatus.ACTIVE;
    } else if (status === SubscriptionRecordStatus.TRIALING && trialingOk) {
      membershipType = MembershipType.PREMIUM;
      membershipStatus = MembershipStatus.TRIALING;
    } else if (status === SubscriptionRecordStatus.PAST_DUE) {
      membershipType = MembershipType.PREMIUM;
      membershipStatus = MembershipStatus.ACTIVE;
    } else if (
      status === SubscriptionRecordStatus.CANCELED ||
      status === SubscriptionRecordStatus.UNPAID ||
      status === SubscriptionRecordStatus.INCOMPLETE_EXPIRED
    ) {
      membershipType = MembershipType.FREE;
      membershipStatus = MembershipStatus.CANCELED;
    }

    await this.prisma.user.update({
      where: { id: userId },
      data: { membershipType, membershipStatus },
    });
  }

  private async userIdFromStripeCustomer(
    stripe: Stripe,
    customerId: string,
  ): Promise<string | null> {
    const c = await stripe.customers.retrieve(customerId);
    if (c.deleted) return null;
    const v = c.metadata?.userId;
    return typeof v === 'string' && v.length ? v : null;
  }
}
