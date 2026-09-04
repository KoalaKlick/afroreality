import { PrismaNeon } from "@prisma/adapter-neon";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "./generated/prisma/client.js";

export * from "./generated/prisma/client.js";

const globalForPrisma = globalThis as unknown as {
  prismaInstance: PrismaClient | undefined;
};

function getPrismaClient(): PrismaClient {
  if (globalForPrisma.prismaInstance) {
    return globalForPrisma.prismaInstance;
  }

  const databaseUrl =
    process.env.DATABASE_URL ||
    process.env.POSTGRES_PRISMA_URL ||
    process.env.POSTGRES_URL;

  if (!databaseUrl) {
    throw new Error(
      "DATABASE_URL environment variable is missing. Please set DATABASE_URL in your Vercel project Settings -> Environment Variables.",
    );
  }

  const isNeon =
    databaseUrl.includes("neon.tech") || databaseUrl.startsWith("neon://");

  const adapter = isNeon
    ? new PrismaNeon({ connectionString: databaseUrl })
    : new PrismaPg({ connectionString: databaseUrl });

  const client = new PrismaClient({ adapter });

  if (process.env.NODE_ENV !== "production") {
    globalForPrisma.prismaInstance = client;
  }

  return client;
}

export const prisma = new Proxy({} as PrismaClient, {
  get(_target, prop, receiver) {
    let client = getPrismaClient();
    if (
      typeof prop === "string" &&
      !prop.startsWith("$") &&
      !prop.startsWith("_") &&
      !(client as any)[prop]
    ) {
      // Model property missing on cached client (e.g. newly added Prisma model during dev HMR)
      globalForPrisma.prismaInstance = undefined;
      client = getPrismaClient();
    }
    const value = Reflect.get(client, prop, receiver);
    if (typeof value === "function") {
      return value.bind(client);
    }
    return value;
  },
});
