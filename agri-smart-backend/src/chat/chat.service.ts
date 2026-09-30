import { Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ChatService {
  constructor(private prisma: PrismaService) {}

  async getMessages(orderId: string, userId: string, role: string) {
    const order = await this.prisma.order.findUnique({
      where: { order_id: orderId },
      include: { buyer: true, farmer: true }
    });
    
    if (!order) throw new NotFoundException('Order not found');

    // ensure user has a profile mapped to this order
    const isBuyer = role === 'BUYER' && order.buyer?.user_id === userId;
    const isFarmer = role === 'FARMER' && order.farmer?.user_id === userId;
    
    if (!isBuyer && !isFarmer) {
      throw new ForbiddenException('Not allowed to view this chat');
    }

    return this.prisma.chatMessage.findMany({
      where: { order_id: orderId },
      orderBy: { created_at: 'asc' }
    });
  }

  async sendMessage(orderId: string, userId: string, role: string, text: string) {
    const order = await this.prisma.order.findUnique({
      where: { order_id: orderId },
      include: { buyer: true, farmer: true }
    });
    
    if (!order) throw new NotFoundException('Order not found');

    const isBuyer = role === 'BUYER' && order.buyer?.user_id === userId;
    const isFarmer = role === 'FARMER' && order.farmer?.user_id === userId;
    
    if (!isBuyer && !isFarmer) {
      throw new ForbiddenException('Not allowed to send message to this chat');
    }

    return this.prisma.chatMessage.create({
      data: {
        order_id: orderId,
        sender_id: userId,
        sender_role: role,
        text
      }
    });
  }
}
