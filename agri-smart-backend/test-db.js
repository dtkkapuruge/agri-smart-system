const { PrismaClient } = require('@prisma/client');

async function main() {
  const url6543 = "postgresql://postgres.rmsrzhklbuflbcrtjuqz:qd2VkZviG1NcI78i@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true";
  const url5432 = "postgresql://postgres.rmsrzhklbuflbcrtjuqz:qd2VkZviG1NcI78i@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres";

  console.log("Testing 5432...");
  const prisma1 = new PrismaClient({ datasources: { db: { url: url5432 } } });
  try {
    await prisma1.$connect();
    console.log("5432 SUCCESS");
  } catch (e) {
    console.error("5432 ERROR:", e.message);
  } finally {
    await prisma1.$disconnect();
  }

  console.log("Testing 6543...");
  const prisma2 = new PrismaClient({ datasources: { db: { url: url6543 } } });
  try {
    await prisma2.$connect();
    console.log("6543 SUCCESS");
  } catch (e) {
    console.error("6543 ERROR:", e.message);
  } finally {
    await prisma2.$disconnect();
  }
}

main().catch(console.error);
