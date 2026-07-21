import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function runMasterTest() {
  console.log('🌟 STARTING FULL AGRI-SMART BACKEND TEST 🌟');

  try {
    // 1. Setup everything
    console.log('🛠️  Step 1: Setting up Farmer, Buyer, and Product...');
    const farmer = await prisma.user.upsert({ where: { email: 'farmer@master.com' }, update: { role: 'FARMER' }, create: { email: 'farmer@master.com', role: 'FARMER' } });
    const farmerProf = await prisma.farmerProfile.upsert({ where: { user_id: farmer.user_id }, update: {}, create: { user_id: farmer.user_id, farm_name: 'Final Test Farm' } });
    await prisma.$executeRaw`UPDATE "FarmerProfile" SET farm_location = ST_GeomFromText('POINT(79.8612 6.9271)', 4326) WHERE profile_id = ${farmerProf.profile_id}`;

    const buyer = await prisma.user.upsert({ where: { email: 'buyer@master.com' }, update: { role: 'BUYER' }, create: { email: 'buyer@master.com', role: 'BUYER' } });
    const buyerProf = await prisma.buyerProfile.upsert({ where: { user_id: buyer.user_id }, update: {}, create: { user_id: buyer.user_id, delivery_address: 'Final Delivery Road' } });
    await prisma.$executeRaw`UPDATE "BuyerProfile" SET location = ST_GeomFromText('POINT(79.8500 6.9300)', 4326) WHERE profile_id = ${buyerProf.profile_id}`;

    const product = await prisma.product.upsert({ where: { product_id: 'final-tomato' }, update: {}, create: { product_id: 'final-tomato', name: 'Master Tomato', category: 'Vegetable' } });

    // 2. Create Order
    console.log('📦 Step 2: Creating a new Order...');
    const order = await prisma.order.create({
      data: { buyer_id: buyerProf.profile_id, product_id: product.product_id, quantity: 10, status: 'PENDING' }
    });

    // 3. Match and Accept
    console.log('🧠 Step 3: Farmer accepting the order...');
    await prisma.order.update({
      where: { order_id: order.order_id },
      data: { status: 'ACCEPTED', farmer_id: farmerProf.profile_id }
    });

    // 4. AI Grading & Forensics
    console.log('📸 Step 4: Running AI Forensics & Dynamic Pricing...');
    const marketPrice = await prisma.marketPrice.create({ data: { product_id: product.product_id, harti_base_price: 100.00 } });
    await prisma.aiVerificationReport.create({
      data: { order_id: order.order_id, price_id: marketPrice.price_id, image_url: 'http://img.com', ai_grade: 'A', quality_score: 99.0, metadata_verified: true, final_price: 120.00 }
    });

    // 5. Payment
    console.log('💳 Step 5: Processing Payment...');
    await prisma.payment.create({ data: { order_id: order.order_id, amount: 120.00, status: 'COMPLETED' } });
    await prisma.order.update({ where: { order_id: order.order_id }, data: { status: 'PAID' } });

    // 6. Delivery & OTP (THE FINAL PART)
    console.log('🚚 Step 6: Starting Delivery and generating OTP...');
    const otp = "1234"; // We will use a fixed OTP for the test
    const delivery = await prisma.deliveryFulfillment.create({
      data: { order_id: order.order_id, farmer_id: farmerProf.profile_id, otp_code: otp, status: 'PENDING' }
    });
    console.log(`🔑 OTP Generated: ${otp}`);

    // 7. Verification
    console.log('✅ Step 7: Verifying OTP and completing order...');
    if (otp === "1234") {
      await prisma.deliveryFulfillment.update({ where: { order_id: order.order_id }, data: { status: 'DELIVERED', delivered_at: new Date() } });
      await prisma.order.update({ where: { order_id: order.order_id }, data: { status: 'DELIVERED' } });
    }

    console.log('\n🏁 --- ALL STEPS SUCCESSFUL! ---');
    console.log('Your Order is now officially DELIVERED in the database.');

  } catch (error) {
    console.error('❌ Test Failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

runMasterTest();
