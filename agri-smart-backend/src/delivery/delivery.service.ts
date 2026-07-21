import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DeliveryService {
  constructor(private prisma: PrismaService) {}

  // 1. Create a Delivery record with a secret OTP
  async createDelivery(orderId: string) {
    const order = await this.prisma.order.findUnique({
      where: { order_id: orderId },
    });

    if (!order || !order.farmer_id) {
      throw new BadRequestException('Order must have a farmer assigned!');
    }

    // Generate a random 4-digit code (e.g., 5732)
    const secretOtp = Math.floor(1000 + Math.random() * 9000).toString();

    return this.prisma.deliveryFulfillment.create({
      data: {
        order_id: orderId,
        farmer_id: order.farmer_id,
        otp_code: secretOtp,
        status: 'PENDING',
      },
    });
  }

  // 2. Verify the OTP when farmer delivers
  async verifyDelivery(orderId: string, inputOtp: string) {
    const delivery = await this.prisma.deliveryFulfillment.findUnique({
      where: { order_id: orderId },
    });

    if (!delivery) throw new BadRequestException('Delivery record not found');

    // Check if the OTP matches
    if (delivery.otp_code !== inputOtp) {
      throw new BadRequestException('Invalid OTP! Delivery cannot be confirmed.');
    }

    // Success! Update status to DELIVERED
    await this.prisma.deliveryFulfillment.update({
      where: { order_id: orderId },
      data: {
        status: 'DELIVERED',
        delivered_at: new Date(),
      },
    });

    // Also update the main Order table
    await this.prisma.order.update({
      where: { order_id: orderId },
      data: { status: 'DELIVERED' },
    });

    return { message: 'Success! Order delivered and verified.' };
  }
}
