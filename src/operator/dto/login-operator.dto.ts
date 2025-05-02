import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

const LoginOperator = z.object({
  barcode: z.string(),
});

export class LoginOperatorDto extends createZodDto(LoginOperator) {}
