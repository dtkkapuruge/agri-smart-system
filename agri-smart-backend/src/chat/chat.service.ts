import { Injectable, ForbiddenException, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ChatService {
  private readonly logger = new Logger(ChatService.name);
  constructor(private prisma: PrismaService) {}

  async getMessages(orderId: string, userId: string, role: string) {
    const order = await this.prisma.order.findUnique({
      where: { order_id: orderId },
      include: { buyer: true, farmer: true }
    });
    
    if (!order) throw new NotFoundException('Order not found');

    // Resolve role from DB if JWT metadata is missing
    const resolvedRole = await this.resolveRole(userId, role);

    const isBuyer = resolvedRole === 'BUYER' && order.buyer?.user_id === userId;
    const isFarmer = resolvedRole === 'FARMER' && order.farmer?.user_id === userId;
    
    if (!isBuyer && !isFarmer) {
      this.logger.warn(`getMessages: user ${userId} (role=${resolvedRole}) not authorized for order ${orderId}`);
      throw new ForbiddenException('Not allowed to view this chat');
    }

    return this.prisma.chatMessage.findMany({
      where: { order_id: orderId },
      orderBy: { created_at: 'asc' }
    });
  }

  async sendMessage(orderId: string, userId: string, role: string, text: string) {
    if (!text || !text.trim()) {
      throw new Error('Message text is required');
    }

    const order = await this.prisma.order.findUnique({
      where: { order_id: orderId },
      include: { buyer: true, farmer: true }
    });
    
    if (!order) throw new NotFoundException('Order not found');

    // Resolve role from DB if JWT metadata is missing
    const resolvedRole = await this.resolveRole(userId, role);

    const isBuyer = resolvedRole === 'BUYER' && order.buyer?.user_id === userId;
    const isFarmer = resolvedRole === 'FARMER' && order.farmer?.user_id === userId;
    
    if (!isBuyer && !isFarmer) {
      this.logger.warn(`sendMessage: user ${userId} (role=${resolvedRole}) not authorized for order ${orderId}`);
      throw new ForbiddenException('Not allowed to send message to this chat');
    }

    const message = await this.prisma.chatMessage.create({
      data: {
        order_id: orderId,
        sender_id: userId,
        sender_role: resolvedRole,
        text: text.trim()
      }
    });
    this.logger.log(`Message sent: order=${orderId} user=${userId}`);
    return message;
  }

  /** Resolve the user's role: use JWT claim if valid, otherwise fall back to DB */
  private async resolveRole(userId: string, jwtRole: string): Promise<string> {
    const valid = ['BUYER', 'FARMER', 'ADMIN'];
    if (jwtRole && valid.includes(jwtRole.toUpperCase())) {
      return jwtRole.toUpperCase();
    }
    const dbUser = await this.prisma.user.findUnique({ where: { user_id: userId } });
    if (dbUser?.role) return dbUser.role.toUpperCase();
    return 'BUYER'; // safe default
  }
}
