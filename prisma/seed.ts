import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seedSettings() {
  console.log('🌱 Seeding settings configuration...');

  // Seed PaymentSettings (singleton with id=1)
  // All fields null - no fake credentials, production environment handles real secrets
  const paymentSettings = await prisma.paymentSettings.upsert({
    where: { id: 1 },
    update: {},
    create: {
      id: 1,
      bankAccountNumber: null,
      bankRoutingNumber: null,
      bankAccountName: null,
      paymentProviderApiKey: null,
      merchantId: null,
      updatedAt: new Date(),
    },
  });
  console.log('✅ PaymentSettings:', paymentSettings.id);

  // Seed NotificationSettings (singleton with id=1)
  // Safe defaults: email and push enabled, API keys null (no fake credentials)
  const notificationSettings = await prisma.notificationSettings.upsert({
    where: { id: 1 },
    update: {},
    create: {
      id: 1,
      emailEnabled: true,
      pushEnabled: true,
      resendApiKey: null,
      oneSignalAppId: null,
      oneSignalApiKey: null,
      updatedAt: new Date(),
    },
  });
  console.log('✅ NotificationSettings:', notificationSettings.id);

  // Seed SystemDefaults (singleton with id=1)
  // Safe defaults: orderNumberPrefix="JL", defaultAcquisitionSource="Manual"
  // Location/zone IDs null (will be configured in admin)
  const systemDefaults = await prisma.systemDefaults.upsert({
    where: { id: 1 },
    update: {},
    create: {
      id: 1,
      defaultShippingZoneId: null,
      defaultStoreLocationId: null,
      defaultAcquisitionSource: 'Manual',
      orderNumberPrefix: 'JL',
      updatedAt: new Date(),
    },
  });
  console.log('✅ SystemDefaults:', systemDefaults.id);

  console.log('✨ Settings seeding complete!');
}

async function main() {
  try {
    await seedSettings();
  } catch (error) {
    console.error('❌ Error during seeding:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
