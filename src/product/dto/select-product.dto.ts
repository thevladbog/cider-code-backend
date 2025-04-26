import { createZodDto } from 'nestjs-zod';
import { ProductSchema } from '../../../prisma/generated/zod';

export class SelectProductDto extends createZodDto(ProductSchema) {}

export class IProductFindMay {
  result: SelectProductDto[];
  total: number;
  page: number;
  limit: number;
  totalPage: number;
}
