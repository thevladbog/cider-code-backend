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

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly prisma: PrismaService,
    private readonly reflector: Reflector,
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

      let token: string | undefined;

      if (jwtType[0] === JWT_TYPE.Common) {
        token = String(request.cookies[jwtType[0]]);
      } else if (jwtType[0] === JWT_TYPE.Operator) {
        token = this.extractTokenFromHeader(request);
      }

      if (!token) throw new UnauthorizedException('JWT cookie missing');

      // Verify the JWT and check if it has been revoked
      //--------------------------------------------------------------------------

      const publicKey: string = fs.readFileSync(
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

  private extractTokenFromHeader(request: Request): string | undefined {
    const authHeader = request.headers.authorization;
    if (!authHeader) return undefined;

    // Remove leading/trailing curly braces from malformed authorization headers
    const cleanedHeader = authHeader.replace(/^{|}$/g, '');

    const [type, token] = cleanedHeader.split(' ') ?? [];

    if (type === 'Bearer' && token) {
      return token;
    }

    return undefined;
  }
}
