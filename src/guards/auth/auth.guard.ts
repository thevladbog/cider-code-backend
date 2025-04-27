import {
  CanActivate,
  ExecutionContext,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';
import { PrismaService } from 'nestjs-prisma';

import { JwtPayload } from 'src/contracts/jwt-payload/jwt-payload.interface';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly prisma: PrismaService,
  ) {}
  private readonly logger = new Logger(AuthGuard.name);

  async canActivate(context: ExecutionContext): Promise<boolean> {
    try {
      // Try to retrieve the JWT from request's cookies
      //--------------------------------------------------------------------------
      const request: Request = context.switchToHttp().getRequest();

      const token: string = String(request.cookies['jwt']);
      if (!token) throw new UnauthorizedException();

      // Verify the JWT and check if it has been revoked
      //--------------------------------------------------------------------------

      const payload: JwtPayload = await this.jwtService.verifyAsync(
        String(request.cookies['jwt']),
        { secret: process.env.JWT_SECRET },
      );

      const revokedToken: { id: string; jti: string } | null =
        await this.prisma.revokedToken.findUnique({
          where: { jti: payload.jti },
        });

      if (revokedToken) throw new UnauthorizedException();

      // Attach user's data to the request
      //--------------------------------------------------------------------------
      request.user = payload;

      return true;
    } catch (err: unknown) {
      this.logger.error(err);
      throw new UnauthorizedException();
    }
  }
}
