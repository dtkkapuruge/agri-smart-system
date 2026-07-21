import { Controller, Post, Body, Param } from '@nestjs/common';
import { PaymentsService } from './payments.service';

@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post(':orderId')
  async pay(@Param('orderId') orderId: string, @Body('amount') amount: number) {
    return this.paymentsService.processPayment(orderId, amount);
  }
}
