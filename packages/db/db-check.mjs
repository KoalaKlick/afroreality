import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from './src/generated/prisma/client.js';

const adapter = new PrismaPg({
  connectionString: 'postgresql://afro_admin:nopassword@127.0.0.1:5432/afro_corp',
});
const client = new PrismaClient({ adapter });
try {
  // Check if email_verified column exists in profiles
  const cols = await client.$queryRaw`
    SELECT column_name FROM information_schema.columns
    WHERE table_schema='public' AND table_name='profiles'
    ORDER BY ordinal_position
  `;
  console.log('PROFILE COLUMNS:', JSON.stringify(cols.map(c => c.column_name)));

  // Check applied migrations
  const migs = await client.$queryRaw`
    SELECT migration_name FROM _prisma_migrations ORDER BY started_at
  `;
  console.log('MIGRATIONS:', JSON.stringify(migs.map(m => m.migration_name)));

  await client.$disconnect();
  process.exit(0);
} catch (e) {
  console.log('ERR', e.message);
  process.exit(1);
}
