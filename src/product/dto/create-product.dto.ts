import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import { Prisma } from '@prisma/client';

export const DECIMAL_STRING_REGEX =
  /^(?:-?Infinity|NaN|-?(?:0[bB][01]+(?:\.[01]+)?(?:[pP][-+]?\d+)?|0[oO][0-7]+(?:\.[0-7]+)?(?:[pP][-+]?\d+)?|0[xX][\da-fA-F]+(?:\.[\da-fA-F]+)?(?:[pP][-+]?\d+)?|(?:\d+|\d*\.\d+)(?:[eE][-+]?\d+)?))$/;

export const DecimalJsLikeSchema: z.ZodType<Prisma.DecimalJsLike> = z.object({
  d: z.array(z.number()),
  e: z.number(),
  s: z.number(),
  toFixed: z.function(z.tuple([]), z.string()),
});

export const isValidDecimalInput = (
  v?: null | string | number | Prisma.DecimalJsLike,
): v is string | number | Prisma.DecimalJsLike => {
  if (v === undefined || v === null) return false;
  return (
    (typeof v === 'object' &&
      'd' in v &&
      'e' in v &&
      's' in v &&
      'toFixed' in v) ||
    (typeof v === 'string' && DECIMAL_STRING_REGEX.test(v)) ||
    typeof v === 'number'
  );
};

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

export class CreatedProductDto extends createZodDto(ProductSchema) {}

const productIdScheme = z.object({
  id: z.string({ description: 'The unique identifier for the product' }),
});

export class CreatedProductId extends createZodDto(productIdScheme) {}
