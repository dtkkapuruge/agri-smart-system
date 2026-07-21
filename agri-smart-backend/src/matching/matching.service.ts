import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class MatchingService {
  constructor(private prisma: PrismaService) {}

  /**
   * Executes the smart-matching algorithm to find the nearest farmers for a specific order.
   * Uses PostGIS ST_Distance for accurate geospatial calculations.
   * @param orderId The unique identifier of the order request
   */
  async findNearestFarmers(orderId: string) {
    // Retrieve order details and buyer's location
    const order = await this.prisma.order.findUnique({
      where: { order_id: orderId },
      include: { buyer: true },
    });

    if (!order || !order.buyer) {
      console.log('❌ Matching failed: Order or Buyer profile not found.');
      return [];
    }

    console.log(`🔍 Initiating smart-matching for Order: ${orderId}`);

    // PostGIS Query: Finds the 5 nearest farmers with a valid location
    const nearestFarmers: any[] = await this.prisma.$queryRaw`
      SELECT 
        fp.profile_id, 
        fp.farm_name, 
        fp.current_rating,
        ST_Distance(
          fp.farm_location::geography, 
          (SELECT location FROM "BuyerProfile" WHERE profile_id = ${order.buyer_id})::geography
        ) / 1000 AS distance_km
      FROM "FarmerProfile" fp
      WHERE fp.farm_location IS NOT NULL
      ORDER BY distance_km ASC
      LIMIT 5
    `;

    console.log(`✅ Identified ${nearestFarmers.length} eligible farmers nearby.`);

    // Log the notification attempts in the database
    for (const farmer of nearestFarmers) {
      await this.prisma.matchingLog.create({
        data: {
          order_id: orderId,
          notified_farmer_id: farmer.profile_id,
          tier_level: 1, // Tier 1 represents the closest geographical match
          response_status: 'PENDING',
        },
      });
    }

    return nearestFarmers;
  }
}
