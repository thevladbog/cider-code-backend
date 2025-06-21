import { createZodDto } from 'nestjs-zod';
import { ProductSchema } from 'src/product/dto/select-product.dto';
import { z } from 'zod';

const ShiftStatusSchema = z.enum([
  'PLANNED',
  'INPROGRESS',
  'PAUSED',
  'DONE',
  'CANCELED',
]);

const ShiftCreateSchema = z
  .object({
    id: z.string().optional(),
    plannedDate: z.coerce.date().optional(),
    plannedCount: z.number().int().optional(),
    factCount: z.number().int().optional(),
    packing: z.boolean().optional(),
    countInBox: z.number().int().optional(),
    status: z.lazy(() => ShiftStatusSchema).optional(),
    productId: z.string(),
  })
  .strict();

export class CreateShiftDto extends createZodDto(ShiftCreateSchema) {}

// DTO для создания смены оператором
const CreateShiftByOperatorSchema = z
  .object({
    ean: z.string().min(8).max(14), // EAN может быть 8, 12, 13 или 14 цифр
    plannedDay: z.coerce.date().optional(), // Если не указана - сегодня
  })
  .strict();

export class CreateShiftByOperatorDto extends createZodDto(
  CreateShiftByOperatorSchema,
) {}

export const ShiftSchema = z.object({
  status: ShiftStatusSchema,
  id: z.string(),
  plannedDate: z.coerce.date(),
  productId: z.string(),
  plannedCount: z.number().int().nullable(),
  factCount: z.number().int().nullable(),
  packing: z.boolean(),
  countInBox: z.number().int().nullable(),
  operatorId: z.string().nullable(),
  created: z.coerce.date(),
  modified: z.coerce.date().nullable(),
});

export class ShiftDto extends createZodDto(ShiftSchema) {}

export const ShiftSchemaOperator = z.object({
  status: ShiftStatusSchema,
  id: z.string(),
  plannedDate: z.coerce.date(),
  product: ProductSchema,
  plannedCount: z.number().int().nullable(),
  factCount: z.number().int().nullable(),
  packing: z.boolean(),
  countInBox: z.number().int().nullable(),
  operatorId: z.string().nullable(),
  created: z.coerce.date(),
  modified: z.coerce.date().nullable(),
});

export class OperatorShiftDto extends createZodDto(ShiftSchemaOperator) {}

export class IShiftFindMany {
  result: OperatorShiftDto[];
  total: number;
  page: number;
  limit: number;
  totalPage: number;
  labelTemplate?: string;
}

export class IShiftFindOne {
  result: OperatorShiftDto;
}

export class IDeletedShift {
  id: string;
  message: string;
}
