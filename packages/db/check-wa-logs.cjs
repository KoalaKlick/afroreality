require('dotenv').config({ path: 'd:/KoalaKlick/afroreality/packages/db/.env' });
const { PrismaPg } = require('d:/KoalaKlick/afroreality/packages/db/node_modules/@prisma/adapter-pg');
const { PrismaClient } = require('d:/KoalaKlick/afroreality/packages/db/src/generated/prisma/index.js');
const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
  const logs = await prisma.whatsAppMessageLog.findMany({
    orderBy: { createdAt: 'desc' },
    take: 5
  });
  console.log(JSON.stringify(logs, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
