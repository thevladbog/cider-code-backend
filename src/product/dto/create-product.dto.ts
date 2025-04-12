import { createZodDto } from 'nestjs-zod';
import {
  ProductCreateArgsSchema,
  ProductCreateInputSchema,
} from '../../../prisma/generated/zod';

export class CreateProductDto extends createZodDto(ProductCreateInputSchema) {}

export class CreatedProductDto extends createZodDto(ProductCreateArgsSchema) {}
