import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PaymentsService {
  constructor(private prisma: PrismaService) {}

  async processPayment(orderId: string, amount: number) {
    const order = await this.prisma.order.findUnique({
      where: { order_id: orderId },
    });

    if (!order) throw new BadRequestException('Order not found');

    // 1. Create the payment record
    const payment = await this.prisma.payment.create({
      data: {
        order_id: orderId,
        amount: amount,
        status: 'COMPLETED',
        paid_at: new Date(),
      },
    });

    // 2. Update the order status to "PAID"
    await this.prisma.order.update({
      where: { order_id: orderId },
      data: { status: 'PAID' },
    });

    return {
      message: 'Payment Successful! Order is now PAID.',
      payment_id: payment.payment_id,
    };
  }
}
