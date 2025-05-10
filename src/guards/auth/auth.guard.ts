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
import { Reflector } from '@nestjs/core';

import { JwtPayload } from 'src/contracts/jwt-payload/jwt-payload.interface';
import { JWT_TYPE } from 'src/constants/jwt.constants';
import * as fs from 'fs';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly prisma: PrismaService,
    private readonly reflector: Reflector,
    private readonly configService: ConfigService,
  ) {}
  private readonly logger = new Logger(AuthGuard.name);

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const jwtType = this.reflector.getAllAndOverride<string[]>('jwtType', [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!jwtType) {
      return false;
    }

    try {
      // Try to retrieve the JWT from request's cookies
      //--------------------------------------------------------------------------
      const request: Request = context.switchToHttp().getRequest();

      const token: string = String(request.cookies[jwtType[0]]);
      if (!token) throw new UnauthorizedException('JWT cookie missing');

      // Verify the JWT and check if it has been revoked
      //--------------------------------------------------------------------------
      if (!process.env.JWT_SECRET) {
        this.logger.error('JWT_SECRET env var is not set');
        throw new UnauthorizedException();
      }
      const publicKey: string =
        this.configService.getOrThrow('JWT_PUBLIC_KEY_PATH') ??
        fs.readFileSync(
          __dirname + '/../../../../config/cert/jwt_public_key.pem',
          'utf8',
        );
      const payload: JwtPayload = await this.jwtService.verifyAsync(token, {
        publicKey,
        algorithms: ['RS256'],
      });

      const revokedToken: { id: string; jti: string } | null =
        await this.prisma.revokedToken.findUnique({
          where: { jti: payload.jti },
        });

      if (revokedToken) throw new UnauthorizedException();

      // Attach user's data to the request
      //--------------------------------------------------------------------------

      if (jwtType[0] === JWT_TYPE.Common) {
        request.user = payload;
      } else if (jwtType[0] === JWT_TYPE.Operator) {
        request.operator = payload;
      } else {
        throw new UnauthorizedException('Unsupported JWT type');
      }

      return true;
    } catch (err: unknown) {
      this.logger.error(err);
      throw new UnauthorizedException();
    }
  }
}
