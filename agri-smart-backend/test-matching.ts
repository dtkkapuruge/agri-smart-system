import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function runTest() {
  console.log('🚀 Starting Automatic Smart Matching Test...');

  try {
    // 1. Create a Test Product
    console.log('🍎 Step 1: Creating a test vegetable...');
    const product = await prisma.product.upsert({
      where: { product_id: 'test-tomato' },
      update: {},
      create: {
        product_id: 'test-tomato',
        name: 'Test Tomato',
        category: 'Vegetable',
      },
    });
    console.log('✅ Product Ready.');

    // 2. Create/Update a Farmer
    console.log('👨‍🌾 Step 2: Syncing a Farmer at (6.9271, 79.8612)...');
    const farmerUser = await prisma.user.upsert({
      where: { email: 'farmer@test.com' },
      update: {},
      create: {
        email: 'farmer@test.com',
        role: 'FARMER',
      },
    });

    const farmerProfile = await prisma.farmerProfile.upsert({
      where: { user_id: farmerUser.user_id },
      update: {},
      create: {
        user_id: farmerUser.user_id,
        farm_name: 'Colombo Smart Farm',
        is_verified: true,
      },
    });

    // Manually set PostGIS location for Farmer
    await prisma.$executeRaw`
      UPDATE "FarmerProfile" 
      SET farm_location = ST_SetSRID(ST_MakePoint(79.8612, 6.9271), 4326)
      WHERE profile_id = ${farmerProfile.profile_id}
    `;
    console.log('✅ Farmer Ready.');

    // 3. Create/Update a Buyer
    console.log('🛒 Step 3: Syncing a Buyer at (6.9300, 79.8500)...');
    const buyerUser = await prisma.user.upsert({
      where: { email: 'buyer@test.com' },
      update: {},
      create: {
        email: 'buyer@test.com',
        role: 'BUYER',
      },
    });

    const buyerProfile = await prisma.buyerProfile.upsert({
      where: { user_id: buyerUser.user_id },
      update: {},
      create: {
        user_id: buyerUser.user_id,
        delivery_address: 'Smart Buyer Apartment',
      },
    });

    // Manually set PostGIS location for Buyer
    await prisma.$executeRaw`
      UPDATE "BuyerProfile" 
      SET location = ST_SetSRID(ST_MakePoint(79.8500, 6.9300), 4326)
      WHERE profile_id = ${buyerProfile.profile_id}
    `;
    console.log('✅ Buyer Ready.');

    // 4. Create an Order
    console.log('📦 Step 4: Creating an Order...');
    const order = await prisma.order.create({
      data: {
        buyer_id: buyerProfile.profile_id,
        product_id: product.product_id,
        quantity: 10,
        status: 'PENDING',
      },
    });
    console.log('✅ Order Created.');

    // 5. Trigger Matching
    console.log('🧠 Step 5: Running Smart Matching algorithm...');
    const nearestFarmers: any[] = await prisma.$queryRaw`
      SELECT 
        fp.profile_id, 
        ST_Distance(fp.farm_location, bp.location) / 1000 AS distance_km
      FROM "FarmerProfile" fp, "BuyerProfile" bp
      WHERE bp.profile_id = ${buyerProfile.profile_id}
        AND fp.farm_location IS NOT NULL
      ORDER BY distance_km ASC
      LIMIT 5
    `;

    if (nearestFarmers.length > 0) {
      console.log(`🎉 SUCCESS! Found ${nearestFarmers.length} farmers nearby.`);
      
      for (const f of nearestFarmers) {
        await prisma.matchingLog.create({
          data: {
            order_id: order.order_id,
            notified_farmer_id: f.profile_id,
            tier_level: 1,
            response_status: 'PENDING',
          },
        });
      }
      console.log('📝 MatchingLog table updated! Check your Supabase now.');
    } else {
      console.log('❌ Failed: No farmers found with location.');
    }

  } catch (error) {
    console.error('❌ Error during test:', error);
  } finally {
    await prisma.$disconnect();
  }
}

runTest();
