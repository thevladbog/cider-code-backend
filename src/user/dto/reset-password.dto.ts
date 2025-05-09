import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

const ResetPasswordRequestZod = z.object({
  email: z
    .string()
    .min(1, { message: 'This field has to be filled.' })
    .email('This is not a valid email.'),
});

export class ResetPasswordRequestDto extends createZodDto(
  ResetPasswordRequestZod,
) {}

const ResetPasswordZod = z.object({
  userId: z.string().min(1, { message: 'This field has to be filled.' }),
  password: z.string(),
  token: z.string(),
});

export class ResetPasswordDto extends createZodDto(ResetPasswordZod) {}
