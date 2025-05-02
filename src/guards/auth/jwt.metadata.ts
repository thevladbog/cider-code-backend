import { SetMetadata } from '@nestjs/common';

export const JwtType = (...metadata: string[]) => SetMetadata('jwt', metadata);
