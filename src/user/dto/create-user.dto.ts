import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const UserCreateInputSchema = z
  .object({
    email: z.string(),
    firstName: z.string(),
    lastName: z.string(),
    password: z.string(),
    picture: z.string().optional(),
  })
  .strict();

export class CreateUserDto extends createZodDto(UserCreateInputSchema) {}

export const UserSchema = z.object({
  id: z.string(),
  email: z.string(),
  firstName: z.string(),
  lastName: z.string(),
  password: z.string().optional(),
  picture: z.string().optional().nullable(),
  created: z.coerce.date(),
  modified: z.coerce.date().nullable(),
});

export class CreatedUserDto extends createZodDto(UserSchema) {}

export class IUserFindMany {
  result: CreatedUserDto[];
  total: number;
  page: number;
  limit: number;
  totalPage: number;
}

export class IUserFindOne {
  result: CreatedUserDto;
}
