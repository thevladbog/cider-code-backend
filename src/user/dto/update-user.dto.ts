import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';

const ROLESchema = z.enum(['ADMIN', 'SUPERVISOR', 'USER', 'GUEST']);

export const UpdateUserSchema = z.object({
  email: z.string().optional(),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  password: z.string().optional(),
  picture: z.string().optional(),
  role: ROLESchema.optional(),
});

export class UpdateUserDto extends createZodDto(UpdateUserSchema) {}
