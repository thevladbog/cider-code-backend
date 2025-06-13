import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

const UpdateCodesStatusSchema = z.object({
  codes: z.array(z.string()),
  shiftId: z.string(),
});

export class UpdateCodesStatusDto extends createZodDto(
  UpdateCodesStatusSchema,
) {}
