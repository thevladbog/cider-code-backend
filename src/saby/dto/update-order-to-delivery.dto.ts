import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import { Prisma } from '@prisma/client';
import { OrdersToDeliveryStatusSchema } from './create-order-to-delivery.dto';

export const OrdersToDeliveryUpdateInputSchema: z.ZodType<Prisma.OrdersToDeliveryUpdateInput> =
  z
    .object({
      id: z.string().optional(),
      orderNumber: z.string().optional(),
      deliveryDate: z.coerce.date().optional(),
      status: z.lazy(() => OrdersToDeliveryStatusSchema).optional(),
      consignee: z.string().optional(),
      address: z.string().optional(),
    })
    .strict();

export class UpdateOrderToDeliveryDto extends createZodDto(
  OrdersToDeliveryUpdateInputSchema,
) {}
