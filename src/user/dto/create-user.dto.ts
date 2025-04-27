import { createZodDto } from 'nestjs-zod';
import { UserCreateInputSchema, UserSchema } from 'prisma/generated/zod';

export class CreateUserDto extends createZodDto(UserCreateInputSchema) {}

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
