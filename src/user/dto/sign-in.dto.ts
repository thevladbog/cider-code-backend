import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

const SignInZod = z.object({
  email: z
    .string()
    .min(1, { message: 'This field has to be filled.' })
    .email('This is not a valid email.'),
  password: z.string(),
});

export class SignInDto extends createZodDto(SignInZod) {}
