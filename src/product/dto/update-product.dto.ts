import { createZodDto } from 'nestjs-zod';
import { ProductUpdateInputSchema } from '../../../prisma/generated/zod';

export class UpdateProductDto extends createZodDto(ProductUpdateInputSchema) {}
