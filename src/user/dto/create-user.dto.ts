import { createZodDto } from 'nestjs-zod';
import { UserCreateInputSchema } from 'prisma/generated/zod';
import { z } from 'zod';

export class CreateUserDto extends createZodDto(UserCreateInputSchema) {}

export const UserSchema = z.object({
  id: z.string(),
  email: z.string(),
  firstName: z.string(),
  lastName: z.string(),
  password: z.string().optional(),
  created: z.coerce.date(),
  modified: z.coerce.date().nullable(),
});

export class CreatedUserDto extends createZodDto(UserSchema) {}

export class IUserFindMay {
  result: CreatedUserDto[];
  total: number;
  page: number;
  limit: number;
  totalPage: number;
}

export class IUserFindOne {
  result: CreatedUserDto;
}
