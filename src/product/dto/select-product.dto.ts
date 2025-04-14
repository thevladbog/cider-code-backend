import { createZodDto } from 'nestjs-zod';
import { ProductSchema } from '../../../prisma/generated/zod';

export class SelectProductDto extends createZodDto(ProductSchema) {}
