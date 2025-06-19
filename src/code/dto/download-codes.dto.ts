import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';

export const downloadCodesSchema = z.object({
  shiftId: z.string().min(1, 'Shift ID is required'),
  includeBoxes: z
    .string()
    .optional()
    .transform((val) => {
      if (val === undefined || val === '') return false;
      return val === 'true' || val === '1';
    })
    .or(z.boolean())
    .default(false),
});

export class DownloadCodesDto extends createZodDto(downloadCodesSchema) {}
