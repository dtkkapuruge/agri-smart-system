import {
  Injectable,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SyncProfileDto } from './dto/sync-profile.dto';

@Injectable()
export class AuthService {
  constructor(private prisma: PrismaService) {}

  /**
   * Synchronizes a Supabase authenticated user with the local application database.
   * This creates a User record and an associated Farmer or Buyer profile.
   * @param supabaseUser The user object received from Supabase Auth
   * @param dto User profile details (role, location, etc.)
   */
  async syncProfile(supabaseUser: any, dto: SyncProfileDto) {
    const email = supabaseUser.email;
    const supabaseUserId = supabaseUser.id;
    const role = (dto.role || supabaseUser.user_metadata?.role || 'FARMER').toUpperCase();

    // 1. Find or create core User record
    let user = await this.prisma.user.findFirst({
      where: {
        OR: [
          { user_id: supabaseUserId },
          { email: email },
        ],
      },
    });

    if (!user) {
      user = await this.prisma.user.create({
        data: {
          user_id: supabaseUserId,
          email: email,
          phone: dto.phone || null,
          role: role,
        },
      });
    }

    let profileId = '';

    if (role === 'FARMER') {
      let farmerProfile = await this.prisma.farmerProfile.findUnique({
        where: { user_id: user.user_id },
      });

      if (!farmerProfile) {
        farmerProfile = await this.prisma.farmerProfile.create({
          data: {
            user_id: user.user_id,
            farm_name: dto.farm_name || supabaseUser.user_metadata?.full_name || 'My Farm',
            current_rating: 0.0,
            is_verified: false,
          },
        });
      }

      // Ensure PostGIS farm_location is set
      const lat = dto.latitude ?? 6.9271;
      const lng = dto.longitude ?? 79.8612;
      await this.prisma.$executeRaw`
        UPDATE "FarmerProfile"
        SET farm_location = ST_SetSRID(ST_MakePoint(${lng}, ${lat}), 4326)
        WHERE profile_id = ${farmerProfile.profile_id}
      `;

      profileId = farmerProfile.profile_id;
    } else {
      let buyerProfile = await this.prisma.buyerProfile.findUnique({
        where: { user_id: user.user_id },
      });

      if (!buyerProfile) {
        buyerProfile = await this.prisma.buyerProfile.create({
          data: {
            user_id: user.user_id,
            delivery_address: dto.delivery_address || 'Not Provided',
          },
        });
      }

      const lat = dto.latitude ?? 6.9271;
      const lng = dto.longitude ?? 79.8612;
      await this.prisma.$executeRaw`
        UPDATE "BuyerProfile"
        SET location = ST_SetSRID(ST_MakePoint(${lng}, ${lat}), 4326)
        WHERE profile_id = ${buyerProfile.profile_id}
      `;

      profileId = buyerProfile.profile_id;
    }

    return {
      message: 'Profile synchronized successfully.',
      user_id: user.user_id,
      profile_id: profileId,
      role: role,
    };
  }

  /**
   * Retrieves the complete profile of the currently authenticated user.
   * @param supabaseUser The user object from the Auth Guard
   */
  async getProfile(supabaseUser: any) {
    const user = await this.prisma.user.findUnique({
      where: { email: supabaseUser.email },
      include: {
        farmer_profile: true,
        buyer_profile: true,
      },
    });

    if (!user) {
      throw new BadRequestException('User profile not found. Please sync your profile first.');
    }

    return user;
  }
}
