import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

const UpdateOperator = z.object({
  regenerateBarcode: z.boolean().optional(),
  name: z.string().optional(),
});

export class UpdateOperatorDto extends createZodDto(UpdateOperator) {}

export const UpdatedOperatorSchema = z.object({
  id: z.string(),
  name: z.string(),
  barcode: z.string().nullable(),
  created: z.coerce.date(),
  modified: z.coerce.date().nullable(),
});

export class UpdatedOperatorDto extends createZodDto(UpdatedOperatorSchema) {}
