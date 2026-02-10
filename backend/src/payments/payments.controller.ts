import { Controller, Post, Body, HttpCode, BadRequestException } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { Public } from '../auth/decorators/public.decorator';

@Controller('payments')
export class PaymentsController {
  constructor(private paymentsService: PaymentsService) {}

  @Public()
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















