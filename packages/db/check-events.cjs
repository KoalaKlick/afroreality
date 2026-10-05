require('dotenv').config({ path: 'd:/KoalaKlick/afroreality/packages/db/.env' });
const { PrismaPg } = require('d:/KoalaKlick/afroreality/packages/db/node_modules/@prisma/adapter-pg');
const { PrismaClient } = require('d:/KoalaKlick/afroreality/packages/db/src/generated/prisma/index.js');
const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
  const events = await prisma.event.findMany({
    select: { id: true, title: true, flierImage: true, bannerImage: true },
    take: 5
  });
  console.log(JSON.stringify(events, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
