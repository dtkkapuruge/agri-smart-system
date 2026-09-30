// Plain JS seed — no TypeScript compilation needed
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Market prices in Rs./kg (HARTI demo values)
const PRICES = {
  Tomato:    200,
  Carrot:    150,
  Cabbage:   100,
  Potato:    120,
  Brinjal:   180,
  Leeks:     160,
  Pumpkin:    90,
  Banana:     80,
  Mango:     250,
  Pineapple: 200,
};

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

async function main() {
  console.log('Seeding products + market prices...');
  for (const p of products) {
    let product = await prisma.product.findFirst({
      where: { name: p.name, category: p.category },
    });
    if (!product) {
      product = await prisma.product.create({ data: p });
      console.log('  Created product:', product.name, '(', product.product_id, ')');
    } else {
      console.log('  Skipped (exists):', p.name);
    }

    // Seed a MarketPrice row if none exists for this product
    const price = PRICES[p.name];
    if (price) {
      const existingPrice = await prisma.marketPrice.findFirst({
        where: { product_id: product.product_id },
      });
      if (!existingPrice) {
        await prisma.marketPrice.create({
          data: {
            product_id: product.product_id,
            harti_base_price: price,
          },
        });
        console.log(`    -> MarketPrice set: Rs. ${price}/kg for ${p.name}`);
      } else {
        console.log(`    -> MarketPrice already exists for ${p.name}: Rs. ${existingPrice.harti_base_price}/kg`);
      }
    }
  }
  console.log('Done.');
}

main()
  .catch((e) => { console.error('Seed error:', e.message); process.exit(1); })
  .finally(() => prisma.$disconnect());
