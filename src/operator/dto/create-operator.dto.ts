import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

const CreateOperator = z.object({
  name: z.string(),
  barcode: z.string().optional(),
});

export class CreateOperatorDto extends createZodDto(CreateOperator) {}

export const CreatedOperatorSchema = z.object({
  id: z.string(),
  name: z.string(),
  barcode: z.string().nullable(),
  created: z.coerce.date(),
  modified: z.coerce.date().nullable(),
});

export class CreatedOperatorDto extends createZodDto(CreatedOperatorSchema) {}

export class IOperatorFindMany {
  result: CreatedOperatorDto[];
  total: number;
  page: number;
  limit: number;
  totalPage: number;
}

export class IOperatorFindOne {
  result: CreatedOperatorDto;
}

export class OperatorLoginResponse {
  token: string;
}
