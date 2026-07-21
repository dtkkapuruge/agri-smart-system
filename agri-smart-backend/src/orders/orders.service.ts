import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { MatchingService } from '../matching/matching.service'; // Added MatchingService import

@Injectable()
export class OrdersService {
  constructor(
    private prisma: PrismaService,
    private matchingService: MatchingService, // Injected MatchingService
  ) {}

  /**
   * 1. Create a new Order request and trigger smart matching
   */
  async createOrder(userId: string, dto: CreateOrderDto) {
    // A. Find the Buyer's Profile ID using their User ID
    const buyerProfile = await this.prisma.buyerProfile.findUnique({
      where: { user_id: userId },
    });

    if (!buyerProfile) {
      throw new BadRequestException('Only users with a Buyer Profile can create orders!');
    }

    // B. Create the order in the database
    const order = await this.prisma.order.create({
      data: {
        buyer_id: buyerProfile.profile_id,
        product_id: dto.product_id,
        quantity: dto.quantity,
        status: 'PENDING', // All new orders start as PENDING
      },
    });

    // C. START THE SMART MATCHING AUTOMATICALLY
    // This calls the algorithm to find nearest farmers and logs them in MatchingLog
    await this.matchingService.findNearestFarmers(order.order_id);

    return order;
  }

  /**
   * 2. Get all orders created by a specific buyer
   */
  async getMyOrders(userId: string) {
    const buyerProfile = await this.prisma.buyerProfile.findUnique({
      where: { user_id: userId },
    });

    if (!buyerProfile) return [];

    return this.prisma.order.findMany({
      where: { buyer_id: buyerProfile.profile_id },
      include: { product: true }, // Shows the vegetable details
    });
  }

  /**
   * 3. Get all "PENDING" orders (For farmers to see)
   */
  async getAvailableOrders() {
    return this.prisma.order.findMany({
      where: { status: 'PENDING' },
      include: { 
        product: true,
        buyer: true 
      },
    });
  }
}