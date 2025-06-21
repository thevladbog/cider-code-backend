import z from 'zod';
import { createZodDto } from 'nestjs-zod';

const ShiftStatusSchema = z.enum([
  'PLANNED',
  'INPROGRESS',
  'PAUSED',
  'DONE',
  'CANCELED',
]);

const UpdateShiftSchema = z
  .object({
    plannedDate: z.coerce.date().optional(),
    plannedCount: z.number().int().optional(),
    packing: z.boolean().optional(),
    countInBox: z.number().int().optional(),
    status: z.lazy(() => ShiftStatusSchema).optional(),
  })
  .strict();

export class UpdateShiftDto extends createZodDto(UpdateShiftSchema) {}
