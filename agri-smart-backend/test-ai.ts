import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function runAiTest() {
  console.log('🚀 Starting Robust AI Test (v3)...');

  try {
    // 1. Setup Farmer
    console.log('👨‍🌾 Step 1: Syncing Farmer...');
    const farmerUser = await prisma.user.upsert({
      where: { email: 'farmer@ai-test.com' },
      update: { role: 'FARMER' },
      create: { email: 'farmer@ai-test.com', role: 'FARMER' },
    });
    const farmerProfile = await prisma.farmerProfile.upsert({
      where: { user_id: farmerUser.user_id },
      update: { farm_name: 'AI Test Farm' },
      create: { user_id: farmerUser.user_id, farm_name: 'AI Test Farm' },
    });
    await prisma.$executeRaw`UPDATE "FarmerProfile" SET farm_location = ST_GeomFromText('POINT(79.8612 6.9271)', 4326) WHERE profile_id = ${farmerProfile.profile_id}`;

    // 2. Setup Market Price (THIS IS THE FIX)
    console.log('📈 Step 2: Creating Market Price record...');
    const product = await prisma.product.upsert({
      where: { product_id: 'test-tomato' },
      update: {},
      create: { product_id: 'test-tomato', name: 'Test Tomato', category: 'Vegetable' },
    });
    const marketPrice = await prisma.marketPrice.create({
      data: {
        product_id: product.product_id,
        harti_base_price: 150.00
      }
    });

    // 3. Setup Buyer & Order
    console.log('🛒 Step 3: Creating Order...');
    const buyerUser = await prisma.user.upsert({
      where: { email: 'buyer@ai-test.com' },
      update: { role: 'BUYER' },
      create: { email: 'buyer@ai-test.com', role: 'BUYER' },
    });
    const buyerProfile = await prisma.buyerProfile.upsert({
      where: { user_id: buyerUser.user_id },
      update: { delivery_address: 'AI Test Road' },
      create: { user_id: buyerUser.user_id, delivery_address: 'AI Test Road' },
    });
    const order = await prisma.order.create({
      data: {
        buyer_id: buyerProfile.profile_id,
        product_id: product.product_id,
        quantity: 5,
        status: 'ACCEPTED',
        farmer_id: farmerProfile.profile_id,
      },
    });

    // 4. Test the API
    console.log(`📸 Step 4: Calling API with real Price ID: ${marketPrice.price_id}`);
    const response = await fetch(`http://localhost:3000/ai-grading/${order.order_id}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        image_url: 'https://example.com/test.jpg',
        latitude: 6.9271,
        longitude: 79.8612,
        // We will pass the price_id so the service can use it
        price_id: marketPrice.price_id 
      })
    });

    const data = await response.json();
    if (response.ok) {
      console.log('✅ SUCCESS! AI Verification Report Created.');
      console.log(data);
    } else {
      console.log('❌ API Error:', data.message);
    }

  } catch (error) {
    console.error('❌ Script Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

runAiTest();
