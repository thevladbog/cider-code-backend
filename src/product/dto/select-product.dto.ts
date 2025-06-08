import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import { Prisma } from '@prisma/client';

export const ProductStatusSchema = z.enum([
  'ACTIVE',
  'INACTIVE',
  'PAUSED',
  'REGISTRATION',
  'ARCHIVED',
]);

export const ProductSchema = z.object({
  status: ProductStatusSchema,
  id: z.string({ description: 'The unique identifier for the product' }),
  shortName: z.string(),
  fullName: z.string(),
  gtin: z.string(),
  alcoholCode: z.string(),
  expirationInDays: z.number().int(),
  volume: z.instanceof(Prisma.Decimal, {
    message:
      "Field 'volume' must be a Decimal. Location: ['Models', 'Product']",
  }),
  pictureUrl: z.string().nullable(),
  created: z.coerce.date(),
  modified: z.coerce.date().nullable(),
});

export class SelectProductDto extends createZodDto(ProductSchema) {}

export class IProductFindMany {
  result: SelectProductDto[];
  total: number;
  page: number;
  limit: number;
  totalPage: number;
}
