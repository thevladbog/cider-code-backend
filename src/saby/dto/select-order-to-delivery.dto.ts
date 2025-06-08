import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import { OrdersToDeliveryStatusSchema } from './create-order-to-delivery.dto';

export const OrdersToDeliverySchema = z.object({
  status: OrdersToDeliveryStatusSchema,
  id: z.string(),
  orderNumber: z.string(),
  deliveryDate: z.coerce.date(),
  consignee: z.string(),
  address: z.string(),
  created: z.coerce.date().nullable(),
  modified: z.coerce.date().nullable(),
});

export class SelectOrderToDeliveryDto extends createZodDto(
  OrdersToDeliverySchema,
) {}
