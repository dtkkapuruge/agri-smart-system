import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from './prisma/prisma.service';

@Injectable()
export class AppService {
  constructor(private prisma: PrismaService) {}

  // Temporary signup - we will replace this with Supabase Auth later
  async signup(signUpData: any) {
    const { email, phone, role } = signUpData;

    try {
      // Create a User with ONLY the fields that exist in our schema
      const user = await this.prisma.user.create({
        data: {
          email: email,
          phone: phone,
          role: role,
        },
      });

      return {
        message: 'User created successfully!',
        userId: user.user_id,
      };
    } catch (error) {
      console.error('Signup Error:', error);
      throw new InternalServerErrorException(
        'Signup failed. Check your data.',
      );
    }
  }
}
