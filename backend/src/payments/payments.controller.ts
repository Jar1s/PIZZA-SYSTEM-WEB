import { Controller, Get, Post, Query, Body, HttpCode, BadRequestException } from '@nestjs/common';
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

  @Public()
  @Get('gopay/resolve')
  @HttpCode(200)
  async resolveGopayReturn(@Query('id') paymentId: string) {
    const normalizedPaymentId = (paymentId || '').trim();
    if (!normalizedPaymentId) {
      throw new BadRequestException('Missing GoPay payment id');
    }
    return this.paymentsService.resolveGopayReturn(normalizedPaymentId);
  }
}














