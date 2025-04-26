import { createZodDto } from 'nestjs-zod';
import { UserCreateInputSchema, UserSchema } from 'prisma/generated/zod';

export class CreateUserDto extends createZodDto(UserCreateInputSchema) {}

export class CreatedUserDto extends createZodDto(UserSchema) {}
