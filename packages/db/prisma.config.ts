import { defineConfig } from 'prisma/config'
import * as dotenv from 'dotenv'

dotenv.config()

const dbUrl = process.env.DATABASE_URL || "postgresql://postgres:postgres@localhost:5432/fextiva";

export default defineConfig({
  schema: './prisma/schema',
  migrations: {
    path: './prisma/migrations',
  },
  datasource: {
    url: dbUrl,
  },
})
