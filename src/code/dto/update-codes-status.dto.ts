import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

const UpdateCodesStatusSchema = z.object({
  codes: z.array(z.string()).min(1, 'At least one code is required'),
  shiftId: z.string().min(1, 'shiftId cannot be empty'),
  productId: z.string().min(1, 'productId cannot be empty').optional(),
});

export class UpdateCodesStatusDto extends createZodDto(
  UpdateCodesStatusSchema,
) {}
