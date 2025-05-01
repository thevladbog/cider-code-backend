import { createZodDto } from 'nestjs-zod';
import { BoxesCodeSchema } from 'prisma/generated/zod';
import { z } from 'zod';

const GetNextBoxesCode = z.object({
  gln: z.string(),
  productId: z.string(),
  currentSscc: z.string().length(18).optional(),
});

export class WriteBoxesCodeDto extends createZodDto(GetNextBoxesCode) {}

export class BoxesCodeDataDto extends createZodDto(BoxesCodeSchema) {}
