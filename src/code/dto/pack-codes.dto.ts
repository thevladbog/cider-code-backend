import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

const PackCodesSchema = z.object({
  id: z.number().int().positive(),
  ssccCode: z.string().length(18),
  codes: z.array(z.string()).min(1, 'At least one code is required'),
  shiftId: z.string().min(1, 'shiftId cannot be empty'),
  productId: z.string().min(1, 'productId cannot be empty'),
});

export class PackCodesDto extends createZodDto(PackCodesSchema) {}

const PackedCodesResponseSchema = z.object({
  id: z.number(),
  ssccCode: z.string(),
});

export class PackedCodesResponseDto extends createZodDto(
  PackedCodesResponseSchema,
) {}
