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
    const jwtTypes = this.reflector.getAllAndOverride<string[]>('jwtType', [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!jwtTypes || jwtTypes.length === 0) {
      return false;
    }

    const request: Request = context.switchToHttp().getRequest();
    const publicKey: string = fs.readFileSync(
      __dirname + '/../../../../config/cert/jwt_public_key.pem',
      'utf8',
    );

    let lastError: unknown = null;
    for (const type of jwtTypes) {
      try {
        let token: string | undefined;
        if (type === JWT_TYPE.Common) {
          token = String(request.cookies[type]);
        } else if (type === JWT_TYPE.Operator) {
          token = this.extractTokenFromHeader(request);
        }
        if (!token) throw new UnauthorizedException('JWT token missing');
        const payload: JwtPayload = await this.jwtService.verifyAsync(token, {
          publicKey,
          algorithms: ['RS256'],
        });
        const revokedToken = await this.prisma.revokedToken.findUnique({
          where: { jti: payload.jti },
        });
        if (revokedToken) throw new UnauthorizedException();
        // Attach user's data to the request
        if (type === JWT_TYPE.Common) {
          request.user = payload;
        } else if (type === JWT_TYPE.Operator) {
          request.operator = payload;
        }
        return true; // At least one valid token found
      } catch (err) {
        lastError = err as unknown;
        // Try next type
      }
    }
    this.logger.error(lastError);
    throw new UnauthorizedException();
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
