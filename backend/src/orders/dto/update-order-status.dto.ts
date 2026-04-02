import { IsEnum } from 'class-validator';
import { OrderStatus } from '@pizza-ecosystem/shared';

export class UpdateOrderStatusDto {
  @IsEnum(OrderStatus)
  status: OrderStatus;
}






















