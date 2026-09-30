import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { MatchingService } from '../matching/matching.service'; // Added MatchingService import

@Injectable()
export class OrdersService {
  private readonly logger = new Logger(OrdersService.name);
  constructor(
    private prisma: PrismaService,
    private matchingService: MatchingService, // Injected MatchingService
  ) {}

  /**
   * 1. Create a new Order request and trigger smart matching
   */
  async createOrder(userId: string, email: string, role: string, dto: CreateOrderDto) {
    // 0. Ensure the User exists in Prisma before we create a BuyerProfile (foreign key constraint)
    let user = await this.prisma.user.findUnique({ where: { user_id: userId } });
    if (!user) {
      user = await this.prisma.user.create({
        data: {
          user_id: userId,
          email: email || `${userId}@placeholder.com`,
          role: role ? role.toUpperCase() : 'BUYER',
        },
      });
    }

    // A. Find or Create the Buyer's Profile using their User ID
    let buyerProfile = await this.prisma.buyerProfile.findUnique({
      where: { user_id: userId },
    });

    if (!buyerProfile) {
      // Auto-create basic BuyerProfile
      buyerProfile = await this.prisma.buyerProfile.create({
        data: {
          user_id: userId,
          delivery_address: 'Not Provided',
        },
      });
    }

    // B. If latitude and longitude are provided, update the buyer's location
    if (dto.latitude !== undefined && dto.longitude !== undefined) {
      await this.prisma.$executeRaw`
        UPDATE "BuyerProfile"
        SET location = ST_SetSRID(ST_MakePoint(${dto.longitude}, ${dto.latitude}), 4326)
        WHERE profile_id = ${buyerProfile.profile_id}
      `;
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
    // Wrapped in try/catch so a matching/PostGIS failure does NOT fail the order
    try {
      await this.matchingService.findNearestFarmers(order.order_id);
    } catch (matchErr) {
      this.logger.error(`Matching failed for order ${order.order_id}: ${matchErr?.message}`, matchErr?.stack);
    }

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
      include: {
        product: true, // Shows the vegetable details
        farmer: {
          include: {
            user: {
              select: {
                email: true,
                phone: true,
              },
            },
          },
        },
        ai_report: true,
      },
      orderBy: { created_at: 'desc' },
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

  /**
   * 4. Get matched orders for a logged-in farmer (PENDING response status in MatchingLog)
   */
  async getFarmerMatchedOrders(farmerIdParam: string) {
    let farmerProfile = await this.prisma.farmerProfile.findFirst({
      where: {
        OR: [
          { profile_id: farmerIdParam },
          { user_id: farmerIdParam }
        ]
      }
    });

    if (!farmerProfile) {
      let user = await this.prisma.user.findUnique({ where: { user_id: farmerIdParam } });
      if (!user) {
        user = await this.prisma.user.create({
          data: {
            user_id: farmerIdParam,
            email: `${farmerIdParam}@farmer.placeholder.com`,
            role: 'FARMER',
          },
        });
      }
      
      farmerProfile = await this.prisma.farmerProfile.create({
        data: {
          user_id: farmerIdParam,
          farm_name: 'My Farm',
        },
      });
    }

    return this.prisma.matchingLog.findMany({
      where: {
        notified_farmer_id: farmerProfile.profile_id,
        response_status: 'PENDING',
        order: {
          status: 'PENDING',
        },
      },
      include: {
        order: {
          include: {
            product: true,
            buyer: {
              include: {
                user: {
                  select: {
                    email: true,
                    phone: true,
                  }
                }
              }
            }
          }
        }
      },
      orderBy: {
        match_id: 'desc',
      },
    });
  }

  /**
   * 4b. Get accepted orders for a logged-in farmer (status = MATCHED or ACCEPTED)
   */
  async getFarmerAcceptedOrders(farmerIdParam: string) {
    const farmerProfile = await this.prisma.farmerProfile.findFirst({
      where: {
        OR: [
          { profile_id: farmerIdParam },
          { user_id: farmerIdParam }
        ]
      }
    });

    if (!farmerProfile) return [];

    return this.prisma.order.findMany({
      where: {
        farmer_id: farmerProfile.profile_id,
        status: { in: ['MATCHED', 'ACCEPTED'] },
      },
      include: {
        product: true,
        buyer: {
          include: {
            user: {
              select: {
                email: true,
                phone: true,
              },
            },
          },
        },
        ai_report: true,
      },
      orderBy: { created_at: 'desc' },
    });
  }

  /**
   * 5. Respond to matched order (ACCEPT or REJECT)
   */
  async respondToMatchedOrder(matchId: string, action: string) {
    const matchLog = await this.prisma.matchingLog.findUnique({
      where: { match_id: matchId },
    });

    if (!matchLog) {
      throw new NotFoundException('Matched order entry not found.');
    }

    const normalizedAction = action ? action.toUpperCase() : '';

    if (normalizedAction === 'ACCEPT' || normalizedAction === 'ACCEPTED') {
      // 1. Update MatchingLog to ACCEPTED
      await this.prisma.matchingLog.update({
        where: { match_id: matchId },
        data: { response_status: 'ACCEPTED' },
      });

      // 2. Set Order.farmer_id and status = MATCHED
      await this.prisma.order.update({
        where: { order_id: matchLog.order_id },
        data: {
          farmer_id: matchLog.notified_farmer_id,
          status: 'MATCHED',
        },
      });

      return { success: true, status: 'ACCEPTED' };
    } else if (normalizedAction === 'REJECT' || normalizedAction === 'REJECTED') {
      // Update MatchingLog to REJECTED
      await this.prisma.matchingLog.update({
        where: { match_id: matchId },
        data: { response_status: 'REJECTED' },
      });

      return { success: true, status: 'REJECTED' };
    } else {
      throw new BadRequestException('Invalid action. Must be ACCEPT or REJECT.');
    }
  }
}