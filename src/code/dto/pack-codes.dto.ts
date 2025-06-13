import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

const PackCodesSchema = z.object({
  id: z.number(),
  ssccCode: z.string().length(18),
  codes: z.array(z.string()),
  shiftId: z.string(),
  productId: z.string(),
});

export class PackCodesDto extends createZodDto(PackCodesSchema) {}

const PackedCodesResponseSchema = z.object({
  id: z.number(),
  ssccCode: z.string(),
});

export class PackedCodesResponseDto extends createZodDto(
  PackedCodesResponseSchema,
) {}
