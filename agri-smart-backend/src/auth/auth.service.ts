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

    // Check if the user already exists in the local database
    const existingUser = await this.prisma.user.findUnique({
      where: { email: email },
    });

    if (existingUser) {
      throw new ConflictException('A profile already exists for this user.');
    }

    // Role-specific validation
    if (dto.role === 'FARMER' && !dto.farm_name) {
      throw new BadRequestException('Farmers must provide a farm name.');
    }

    if (dto.role === 'BUYER' && !dto.delivery_address) {
      throw new BadRequestException('Buyers must provide a delivery address.');
    }

    // Execute database transaction to ensure atomicity
    const result = await this.prisma.$transaction(async (tx) => {
      // Create the core User record
      const user = await tx.user.create({
        data: {
          user_id: supabaseUserId,
          email: email,
          phone: dto.phone || null,
          role: dto.role,
        },
      });

      if (dto.role === 'FARMER') {
        // Initialize Farmer Profile
        const farmerProfile = await tx.farmerProfile.create({
          data: {
            user_id: user.user_id,
            farm_name: dto.farm_name,
            current_rating: 0.0,
            is_verified: false,
          },
        });

        // Set PostGIS location if coordinates are provided
        if (dto.latitude && dto.longitude) {
          await tx.$executeRaw`
            UPDATE "FarmerProfile"
            SET farm_location = ST_SetSRID(ST_MakePoint(${dto.longitude}, ${dto.latitude}), 4326)
            WHERE profile_id = ${farmerProfile.profile_id}
          `;
        }

        return {
          message: 'Farmer profile synchronized successfully.',
          user_id: user.user_id,
          profile_id: farmerProfile.profile_id,
          role: 'FARMER',
        };
      } else {
        // Initialize Buyer Profile
        const buyerProfile = await tx.buyerProfile.create({
          data: {
            user_id: user.user_id,
            delivery_address: dto.delivery_address,
          },
        });

        // Set PostGIS location if coordinates are provided
        if (dto.latitude && dto.longitude) {
          await tx.$executeRaw`
            UPDATE "BuyerProfile"
            SET location = ST_SetSRID(ST_MakePoint(${dto.longitude}, ${dto.latitude}), 4326)
            WHERE profile_id = ${buyerProfile.profile_id}
          `;
        }

        return {
          message: 'Buyer profile synchronized successfully.',
          user_id: user.user_id,
          profile_id: buyerProfile.profile_id,
          role: 'BUYER',
        };
      }
    });

    return result;
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
