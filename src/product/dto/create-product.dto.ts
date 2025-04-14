import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import {
  ProductCreateManyInputSchema,
  ProductSchema,
} from '../../../prisma/generated/zod';

export class CreateProductDto extends createZodDto(
  ProductCreateManyInputSchema,
) {}

export class CreatedProductDto extends createZodDto(ProductSchema) {}

const productIdScheme = z.object({
  id: z.string({ description: 'The unique identifier for the product' }),
});

export class CreatedProductId extends createZodDto(productIdScheme) {}
