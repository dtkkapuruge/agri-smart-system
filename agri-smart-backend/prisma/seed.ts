import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const products = [
    { name: 'Tomato',    category: 'Vegetable', description: 'Fresh red tomatoes' },
    { name: 'Carrot',    category: 'Vegetable', description: 'Organic carrots' },
    { name: 'Cabbage',   category: 'Vegetable', description: 'Green cabbage' },
    { name: 'Potato',    category: 'Vegetable', description: 'White potatoes' },
    { name: 'Brinjal',   category: 'Vegetable', description: 'Purple eggplant' },
    { name: 'Leeks',     category: 'Vegetable', description: 'Fresh leeks' },
    { name: 'Pumpkin',   category: 'Vegetable', description: 'Yellow pumpkin' },
    { name: 'Banana',    category: 'Fruit',     description: 'Ripe bananas' },
    { name: 'Mango',     category: 'Fruit',     description: 'Sweet mangoes' },
    { name: 'Pineapple', category: 'Fruit',     description: 'Fresh pineapples' },
  ];

  for (const p of products) {
    // Use createMany with skipDuplicates not available for unique-less fields,
    // so we just create and ignore conflicts by checking first.
    const existing = await prisma.product.findFirst({
      where: { name: p.name, category: p.category },
    });
    if (!existing) {
      await prisma.product.create({ data: p });
      console.log(`  Created: ${p.name}`);
    } else {
      console.log(`  Skipped (exists): ${p.name}`);
    }
  }

  console.log('✅ Done seeding products.');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
