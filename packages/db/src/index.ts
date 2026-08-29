import { Pool, neonConfig } from "@neondatabase/serverless";
import { PrismaNeon } from "@prisma/adapter-neon";
import ws from "ws";
import { PrismaClient } from "./generated/prisma/client.js";

export * from "./generated/prisma/client.js";

if (typeof WebSocket === "undefined") {
  neonConfig.webSocketConstructor = ws;
}

const globalForPrisma = globalThis as unknown as {
  prismaInstance: PrismaClient | undefined;
};

function getPrismaClient(): PrismaClient {
  if (globalForPrisma.prismaInstance) {
    return globalForPrisma.prismaInstance;
  }

  const connectionString =
    process.env.DATABASE_URL ||
    process.env.POSTGRES_PRISMA_URL ||
    process.env.POSTGRES_URL;

  if (!connectionString) {
    console.error(
      "❌ FATAL: DATABASE_URL is not set in process.env on Vercel!",
    );
    throw new Error(
      "DATABASE_URL environment variable is missing on Vercel. Please go to Vercel Dashboard -> Project Settings -> Environment Variables, add DATABASE_URL (ensure 'Production' checkbox is ticked), and Redeploy.",
    );
  }

  const pool = new Pool({ connectionString });
  const adapter = new PrismaNeon(pool as any);
  const client = new PrismaClient({ adapter });

  if (process.env.NODE_ENV !== "production") {
    globalForPrisma.prismaInstance = client;
  }

  return client;
}

export const prisma = new Proxy({} as PrismaClient, {
  get(_target, prop, receiver) {
    const client = getPrismaClient();
    const value = Reflect.get(client, prop, receiver);
    if (typeof value === "function") {
      return value.bind(client);
    }
    return value;
  },
});
