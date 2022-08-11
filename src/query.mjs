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

query("select * from t").then(e=>console.log(e)).catch(e=>console.log(e))
export { query };

