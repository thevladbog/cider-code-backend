import { createZodDto } from 'nestjs-zod';
import { ProductStatus } from '@prisma/client';
import { ApiProperty } from '@nestjs/swagger';
import { ProductUpdateManyMutationInputSchema } from '../../../prisma/generated/zod';

export class UpdateProductDto extends createZodDto(
  ProductUpdateManyMutationInputSchema,
) {}

export class UpdateProductStatusDto {
  @ApiProperty({
    enum: ProductStatus,
    isArray: false,
    example: ProductStatus.ACTIVE,
  })
  status: ProductStatus;
}
