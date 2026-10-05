import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class MatchingService {
  constructor(private prisma: PrismaService) {}

  // ─────────────────────────────────────────────────────────────────────────────
  // CORE: PostGIS weighted-matching query
  // ─────────────────────────────────────────────────────────────────────────────

  /**
   * Executes the tiered smart-matching algorithm to find the best farmers for a
   * specific order.  Uses PostGIS ST_Distance for geospatial calculations and a
   * weighted score: (rating × 20) − distance_km.
   *
   * Tier 1 → top 3 matches (notified first)
   * Tier 2 → matches 4-10  (fallback if Tier-1 all reject)
   *
   * @param orderId  UUID of the order to match
   */
  async startTieredMatching(orderId: string) {
    return this.findNearestFarmers(orderId);
  }

  /** @internal alias kept for backward-compat with OrdersService */
  async findNearestFarmers(orderId: string) {
    // Retrieve order details and buyer location
    const order = await this.prisma.order.findUnique({
      where: { order_id: orderId },
      include: { buyer: true },
    });

    if (!order || !order.buyer) {
      console.log('❌ Matching failed: Order or Buyer profile not found.');
      return [];
    }

    // Guard: don't re-run matching if logs already exist for this order
    const existingLogs = await this.prisma.matchingLog.count({
      where: { order_id: orderId },
    });
    if (existingLogs > 0) {
      console.log(`⚠️  Matching already ran for Order ${orderId} (${existingLogs} logs found). Skipping.`);
      return [];
    }

    console.log(`🔍 Initiating tiered smart-matching for Order: ${orderId}`);

    // PostGIS weighted query
    // Score = (current_rating × 20) − distance_km
    // Farmers are ordered by score DESC; top 10 are selected.
    const bestFarmers: any[] = await this.prisma.$queryRaw`
      WITH BuyerLoc AS (
        SELECT location FROM "BuyerProfile" WHERE profile_id = ${order.buyer_id}
      )
      SELECT
        fp.profile_id,
        fp.farm_name,
        fp.current_rating,
        ST_Distance(
          COALESCE(fp.farm_location, ST_SetSRID(ST_MakePoint(79.8612, 6.9271), 4326))::geography,
          COALESCE((SELECT location FROM BuyerLoc)::geography, ST_SetSRID(ST_MakePoint(79.8612, 6.9271), 4326)::geography)
        ) / 1000 AS distance_km,
        (fp.current_rating * 20) - (
          ST_Distance(
            COALESCE(fp.farm_location, ST_SetSRID(ST_MakePoint(79.8612, 6.9271), 4326))::geography,
            COALESCE((SELECT location FROM BuyerLoc)::geography, ST_SetSRID(ST_MakePoint(79.8612, 6.9271), 4326)::geography)
          ) / 1000
        ) AS match_score
      FROM "FarmerProfile" fp
      ORDER BY match_score DESC
      LIMIT 10
    `;

    console.log(`✅ Found ${bestFarmers.length} eligible farmers via weighted matching.`);

    // Assign tier labels then persist MatchingLog rows
    // Tier 1: index 0-2  |  Tier 2: index 3-9
    const matchedWithTiers = bestFarmers.map((farmer, index) => ({
      ...farmer,
      tier_level: index < 3 ? 1 : 2,
    }));

    for (const farmer of matchedWithTiers) {
      await this.prisma.matchingLog.create({
        data: {
          order_id: orderId,
          notified_farmer_id: farmer.profile_id,
          tier_level: farmer.tier_level,
          response_status: 'PENDING',
        },
      });
      console.log(
        `📡 Notified [${farmer.farm_name}] — Tier ${farmer.tier_level} | ` +
        `Score: ${Number(farmer.match_score).toFixed(2)} | Distance: ${Number(farmer.distance_km).toFixed(2)} km`,
      );
    }

    return matchedWithTiers;
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // ACCEPT  — farmer confirms they will fulfil the order
  // ─────────────────────────────────────────────────────────────────────────────

  /**
   * Marks a MatchingLog entry as ACCEPTED and updates the parent Order:
   *   • Order.farmer_id = farmer from the log
   *   • Order.status    = 'MATCHED'
   *
   * Throws ConflictException when the order is already matched.
   */
  async acceptMatch(matchId: string) {
    const matchLog = await this.prisma.matchingLog.findUnique({
      where: { match_id: matchId },
    });

    if (!matchLog) {
      throw new NotFoundException(`MatchingLog with id "${matchId}" not found.`);
    }

    if (matchLog.response_status !== 'PENDING') {
      throw new ConflictException(
        `Match is already in status "${matchLog.response_status}". Only PENDING matches can be accepted.`,
      );
    }

    // Check the order hasn't already been claimed by another farmer
    const order = await this.prisma.order.findUnique({
      where: { order_id: matchLog.order_id },
    });

    // Only block if order already matched; listing orders have farmer_id set but status still PENDING
    if (order?.status === 'MATCHED') {
      throw new ConflictException('This order has already been accepted by another farmer.');
    }

    // 1. Update MatchingLog
    await this.prisma.matchingLog.update({
      where: { match_id: matchId },
      data: { response_status: 'ACCEPTED' },
    });

    // 2. Assign farmer and transition order status
    const updatedOrder = await this.prisma.order.update({
      where: { order_id: matchLog.order_id },
      data: {
        farmer_id: matchLog.notified_farmer_id,
        status: 'MATCHED',
      },
      include: { product: true, buyer: true },
    });

    // 3. If this order originated from a FarmerListing, deduct quantity now
    if (order?.listing_id) {
      const listing = await this.prisma.farmerListing.findUnique({
        where: { listing_id: order.listing_id },
      });
      if (listing) {
        const newQty = listing.quantity - (order.quantity ?? 0);
        await this.prisma.farmerListing.update({
          where: { listing_id: order.listing_id },
          data: {
            quantity: Math.max(newQty, 0),
            status: newQty <= 0 ? 'SOLD' : 'AVAILABLE',
          },
        });
        console.log(`📦 Listing ${order.listing_id} quantity updated → ${Math.max(newQty, 0)} kg remaining`);
      }
    }

    console.log(`✅ Match ACCEPTED — Order ${matchLog.order_id} assigned to Farmer ${matchLog.notified_farmer_id}`);

    return {
      success: true,
      status: 'ACCEPTED',
      order: updatedOrder,
    };
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // REJECT  — farmer declines; escalate to Tier 2 if all Tier-1 rejected
  // ─────────────────────────────────────────────────────────────────────────────

  /**
   * Marks a MatchingLog entry as REJECTED.
   * If ALL Tier-1 matches for the same order are now rejected, the Tier-2
   * farmers are escalated (their logs already exist; here we simply log the
   * escalation so the frontend/push service knows to resurface them).
   */
  async rejectMatch(matchId: string) {
    const matchLog = await this.prisma.matchingLog.findUnique({
      where: { match_id: matchId },
    });

    if (!matchLog) {
      throw new NotFoundException(`MatchingLog with id "${matchId}" not found.`);
    }

    if (matchLog.response_status !== 'PENDING') {
      throw new ConflictException(
        `Match is already in status "${matchLog.response_status}". Only PENDING matches can be rejected.`,
      );
    }

    // Mark as rejected
    await this.prisma.matchingLog.update({
      where: { match_id: matchId },
      data: { response_status: 'REJECTED' },
    });

    // Check if all Tier-1 matches for this order have been rejected → escalate
    const tier1Logs = await this.prisma.matchingLog.findMany({
      where: { order_id: matchLog.order_id, tier_level: 1 },
    });

    const allTier1Rejected = tier1Logs.every((log) => log.response_status === 'REJECTED');

    let escalated = false;
    if (allTier1Rejected) {
      const tier2Pending = await this.prisma.matchingLog.count({
        where: {
          order_id: matchLog.order_id,
          tier_level: 2,
          response_status: 'PENDING',
        },
      });

      if (tier2Pending > 0) {
        escalated = true;
        console.log(
          `🚀 All Tier-1 farmers rejected Order ${matchLog.order_id}. ` +
          `Escalating to ${tier2Pending} Tier-2 farmer(s).`,
        );
      }
    }

    console.log(`❌ Match REJECTED — MatchingLog ${matchId}`);

    return {
      success: true,
      status: 'REJECTED',
      tier2_escalated: escalated,
    };
  }
}

