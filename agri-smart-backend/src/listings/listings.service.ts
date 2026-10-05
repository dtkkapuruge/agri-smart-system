import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ListingsService {
  constructor(private prisma: PrismaService) {}

  async getAllListings() {
    return this.prisma.farmerListing.findMany({
      where: { status: 'AVAILABLE' },
      include: {
        product: true,
        farmer: {
          include: { user: true },
        },
      },
      orderBy: { created_at: 'desc' },
    });
  }

  async getFarmerListings(farmerId: string) {
    return this.prisma.farmerListing.findMany({
      where: { farmer_id: farmerId },
      include: { product: true },
      orderBy: { created_at: 'desc' },
    });
  }

  /**
   * Buyer clicks "Buy Now" on a listing.
   *
   * Flow:
   *  1. Validate listing availability & quantity
   *  2. Resolve / create BuyerProfile
   *  3. Create an Order (status = PENDING) linked to the listing
   *  4. Create a MatchingLog for the listing's farmer (same notification
   *     mechanism as the regular order-matching flow)
   *  5. Quantity is NOT deducted yet — that happens when the farmer accepts
   */
  async placeOrderFromListing(listingId: string, body: any) {
    const { buyer_id, quantity } = body;

    if (!buyer_id || !quantity) {
      throw new BadRequestException('buyer_id and quantity are required');
    }

    const listing = await this.prisma.farmerListing.findUnique({
      where: { listing_id: listingId },
    });

    if (!listing) {
      throw new BadRequestException('Listing not found');
    }

    if (listing.status !== 'AVAILABLE') {
      throw new BadRequestException('This listing is no longer available');
    }

    if (listing.quantity < Number(quantity)) {
      throw new BadRequestException('Not enough quantity available');
    }

    // ── Resolve or create BuyerProfile ──────────────────────────────────────
    let buyerProfile = await this.prisma.buyerProfile.findFirst({
      where: {
        OR: [{ profile_id: buyer_id }, { user_id: buyer_id }],
      },
    });

    if (!buyerProfile) {
      // Ensure the User row exists first (FK constraint)
      let user = await this.prisma.user.findUnique({
        where: { user_id: buyer_id },
      });
      if (!user) {
        user = await this.prisma.user.create({
          data: {
            user_id: buyer_id,
            email: `${buyer_id}@placeholder.com`,
            role: 'BUYER',
          },
        });
      }
      buyerProfile = await this.prisma.buyerProfile.create({
        data: {
          user_id: buyer_id,
          delivery_address: 'Not Provided',
        },
      });
    }

    // ── Create PENDING order ─────────────────────────────────────────────────
    const order = await this.prisma.order.create({
      data: {
        buyer_id: buyerProfile.profile_id,
        farmer_id: listing.farmer_id,   // pre-assigned from listing
        product_id: listing.product_id,
        listing_id: listing.listing_id,
        quantity: Number(quantity),
        status: 'PENDING',
      },
    });

    // ── Notify farmer via MatchingLog (reuses the same Accept/Reject flow) ───
    await this.prisma.matchingLog.create({
      data: {
        order_id: order.order_id,
        notified_farmer_id: listing.farmer_id,
        tier_level: 1,
        response_status: 'PENDING',
      },
    });

    return order;
  }

  /**
   * Called by the matching service once a farmer accepts an order that was
   * created from a listing. Deducts quantity and marks listing as SOLD if needed.
   */
  async confirmListingQuantity(listingId: string, quantity: number) {
    const listing = await this.prisma.farmerListing.findUnique({
      where: { listing_id: listingId },
    });
    if (!listing) return;

    const newQuantity = listing.quantity - quantity;
    await this.prisma.farmerListing.update({
      where: { listing_id: listingId },
      data: {
        quantity: Math.max(newQuantity, 0),
        status: newQuantity <= 0 ? 'SOLD' : 'AVAILABLE',
      },
    });
  }
}
