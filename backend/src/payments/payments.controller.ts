import { Controller, Post, Body, HttpCode, BadRequestException } from '@nestjs/common';
import { PaymentsService } from './payments.service';

@Controller('payments')
export class PaymentsController {
  constructor(private paymentsService: PaymentsService) {}

  @Post('session')
  @HttpCode(200)
  async createSession(@Body() data: { orderId: string }) {
    const orderId = (data?.orderId || '').trim();
    if (!orderId) {
      throw new BadRequestException('Missing orderId');
    }
    return this.paymentsService.createPaymentSession(orderId);
  }
}
















