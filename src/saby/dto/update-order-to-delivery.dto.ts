import { PartialType } from '@nestjs/swagger';
import { CreateOrderToDeliveryDto } from './create-order-to-delivery.dto';

export class UpdateOrderToDeliveryDto extends PartialType(
  CreateOrderToDeliveryDto,
) {}
