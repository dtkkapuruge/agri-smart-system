import { Controller, Get, Post, Body, Param, Req, UseGuards } from '@nestjs/common';
import { ChatService } from './chat.service';
import { SupabaseAuthGuard } from '../auth/auth.guard';

@Controller('chat')
@UseGuards(SupabaseAuthGuard)
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Get(':orderId/messages')
  async getMessages(@Param('orderId') orderId: string, @Req() req: any) {
    const userId = req.user.id;
    const role = req.user.user_metadata?.role || req.user.role || 'BUYER';
    return this.chatService.getMessages(orderId, userId, role);
  }

  @Post(':orderId/messages')
  async sendMessage(
    @Param('orderId') orderId: string,
    @Body('text') text: string,
    @Req() req: any
  ) {
    const userId = req.user.id;
    const role = req.user.user_metadata?.role || req.user.role || 'BUYER';
    return this.chatService.sendMessage(orderId, userId, role, text);
  }
}
