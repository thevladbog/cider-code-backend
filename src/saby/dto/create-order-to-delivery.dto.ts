import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import { Prisma } from '@prisma/client';

export const OrdersToDeliveryStatusSchema = z.enum(['NEW', 'ARCHIVE']);

export const OrdersToDeliveryCreateInputSchema: z.ZodType<Prisma.OrdersToDeliveryCreateInput> =
  z
    .object({
      id: z.string().optional(),
      orderNumber: z.string(),
      deliveryDate: z.coerce.date(),
      status: z.lazy(() => OrdersToDeliveryStatusSchema).optional(),
      consignee: z.string(),
      address: z.string(),
      created: z.coerce.date().optional().nullable(),
      modified: z.coerce.date().optional().nullable(),
    })
    .strict();

export class CreateOrderToDeliveryDto extends createZodDto(
  OrdersToDeliveryCreateInputSchema,
) {}

const orderToDeliveryIdScheme = z.object({
  id: z.string({ description: 'The unique identifier for the order' }),
});

export class CreatedOrderToDeliveryId extends createZodDto(
  orderToDeliveryIdScheme,
) {}
