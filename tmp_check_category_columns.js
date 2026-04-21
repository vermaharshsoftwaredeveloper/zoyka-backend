import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
try {
  const rows = await prisma.$queryRaw`select column_name, data_type from information_schema.columns where table_name='category'`;
  console.log(JSON.stringify(rows, null, 2));
} catch (err) {
  console.error(err);
} finally {
  await prisma.$disconnect();
}
