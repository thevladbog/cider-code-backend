import { createZodDto } from 'nestjs-zod';
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
    plannedCount: z.number().int().optional().nullable(),
    factCount: z.number().int().optional().nullable(),
    packing: z.boolean().optional(),
    countInBox: z.number().int().optional().nullable(),
    status: z.lazy(() => ShiftStatusSchema).optional(),
    productId: z.string(),
  })
  .strict();

export class CreateShiftDto extends createZodDto(ShiftCreateSchema) {}

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

export class IShiftFindMany {
  result: ShiftDto[];
  total: number;
  page: number;
  limit: number;
  totalPage: number;
}

export class IShiftFindOne {
  result: ShiftDto;
}

export class IDeletedShift {
  id: string;
  message: string;
}
