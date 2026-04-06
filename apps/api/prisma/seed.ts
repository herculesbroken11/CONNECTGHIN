import {
  PrismaClient,
  UserRole,
  MembershipType,
  MembershipStatus,
} from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const adminEmail = process.env.SEED_ADMIN_EMAIL ?? 'admin@connectghin.local';
  const adminPassword = process.env.SEED_ADMIN_PASSWORD ?? 'ChangeMeAdmin123!';
  const hash = await bcrypt.hash(adminPassword, 12);

  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    create: {
      email: adminEmail,
      passwordHash: hash,
      firstName: 'Platform',
      lastName: 'Admin',
      username: 'platform_admin',
      role: UserRole.ADMIN,
      membershipType: MembershipType.PREMIUM,
      membershipStatus: MembershipStatus.ACTIVE,
      isEmailVerified: true,
      profile: {
        create: {
          displayName: 'Admin',
          bio: 'System administrator',
          profileCompletionPercent: 100,
        },
      },
    },
    update: {
      passwordHash: hash,
      role: UserRole.ADMIN,
      isActive: true,
      isSuspended: false,
      suspensionReason: null,
    },
  });

  const defaults = [
    { key: 'premium_monthly_amount_cents', valueJson: JSON.stringify(299) },
    { key: 'premium_currency', valueJson: JSON.stringify('usd') },
    { key: 'trial_days', valueJson: JSON.stringify(7) },
    { key: 'free_daily_swipe_limit', valueJson: JSON.stringify(10) },
    { key: 'free_daily_swipe_limit_enabled', valueJson: JSON.stringify(true) },
    { key: 'premium_direct_messaging_enabled', valueJson: JSON.stringify(false) },
    { key: 'premium_trialing_features_enabled', valueJson: JSON.stringify(true) },
    { key: 'in_app_notifications_enabled', valueJson: JSON.stringify(true) },
    { key: 'push_notifications_enabled', valueJson: JSON.stringify(true) },
  ];

  for (const row of defaults) {
    await prisma.appSettings.upsert({
      where: { key: row.key },
      create: row,
      update: { valueJson: row.valueJson },
    });
  }

  // eslint-disable-next-line no-console
  console.log('Seed OK. Admin:', admin.email);
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });
