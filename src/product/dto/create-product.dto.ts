import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import { Prisma } from '@prisma/client';
import {
  ProductSchema,
  isValidDecimalInput,
  ProductStatusSchema,
  DecimalJsLikeSchema,
} from '../../../prisma/generated/zod';

export const ProductCreateManyInputSchema = z
  .object({
    shortName: z.string(),
    fullName: z.string(),
    gtin: z.string(),
    alcoholCode: z.string(),
    expirationInDays: z.number().int(),
    volume: z
      .union([
        z.number(),
        z.string(),
        z.instanceof(Prisma.Decimal),
        DecimalJsLikeSchema,
      ])
      .refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }),
    pictureUrl: z.string().optional().nullable(),
    status: z.lazy(() => ProductStatusSchema).optional(),
  })
  .strict();

export class CreateProductDto extends createZodDto(
  ProductCreateManyInputSchema,
) {}

export class CreatedProductDto extends createZodDto(ProductSchema) {}

const productIdScheme = z.object({
  id: z.string({ description: 'The unique identifier for the product' }),
});

export class CreatedProductId extends createZodDto(productIdScheme) {}
