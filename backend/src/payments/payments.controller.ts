import { Controller, Post, Body, HttpCode } from '@nestjs/common';
import { PaymentsService } from './payments.service';

@Controller('api/payments')
export class PaymentsController {
  constructor(private paymentsService: PaymentsService) {}

  @Post('session')
  @HttpCode(200)
  async createSession(@Body() data: { orderId: string }) {
    return this.paymentsService.createPaymentSession(data.orderId);
  }
}


