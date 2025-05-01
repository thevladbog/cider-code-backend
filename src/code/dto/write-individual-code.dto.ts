import { createZodDto } from 'nestjs-zod';
import {
  IndividualCodeSchema,
  IndividualCodeStatusSchema,
} from 'prisma/generated/zod';
import { z } from 'zod';

const IndividualCode = z.object({
  code: z.string(),
  status: IndividualCodeStatusSchema,
  productId: z.string(),
  boxesCodeId: z.number().optional(),
  shiftId: z.string().optional(),
});

export class WriteIndividualCodeDto extends createZodDto(IndividualCode) {}

export class IndividualCodeDataDto extends createZodDto(IndividualCodeSchema) {}
