import { PrismaClient } from "@prisma/client";

async function query(sql) {
  const prisma = new PrismaClient();
  try {
    const result = prisma.$queryRawUnsafe(sql);
    await prisma.$disconnect();
    return result;
  } catch (error) {
    await prisma.$disconnect();
  }
}

export { query };

