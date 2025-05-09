import { HttpStatus, Module } from '@nestjs/common';
import { APP_FILTER, APP_INTERCEPTOR, HttpAdapterHost } from '@nestjs/core';
import { ZodSerializerInterceptor } from 'nestjs-zod';
import { SentryGlobalFilter, SentryModule } from '@sentry/nestjs/setup';
import { HttpExceptionFilter } from './http-exception.filter';
import {
  PrismaClientExceptionFilter,
  PrismaModule,
  PrismaService,
} from 'nestjs-prisma';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ProductModule } from './product/product.module';
import { UserModule } from './user/user.module';
import { LoggerModule } from 'nestjs-pino';
import { loggerOptions } from './config/logger.config';
import { JwtModule, JwtModuleOptions } from '@nestjs/jwt';
import { CodeModule } from './code/code.module';
import { OperatorModule } from './operator/operator.module';
import { join } from 'path';
import { readFileSync, existsSync } from 'fs';
import { ShiftModule } from './shift/shift.module';
import { MailModule } from './mail/mail.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    PrismaModule.forRoot({
      isGlobal: true,
    }),
    ProductModule,
    UserModule,
    SentryModule.forRoot(),
    LoggerModule.forRoot(loggerOptions),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => {
        const pubKeyPath =
          configService.get<string>('JWT_PUBLIC_KEY_PATH') ??
          join(process.cwd(), 'config', 'cert', 'jwt_public_key.pem');
        const privKeyPath =
          configService.get<string>('JWT_PRIVATE_KEY_PATH') ??
          join(process.cwd(), 'config', 'cert', 'jwt_private_key.pem');

        if (!existsSync(pubKeyPath) || !existsSync(privKeyPath)) {
          throw new Error(
            `Missing JWT key file: ${
              !existsSync(pubKeyPath) ? pubKeyPath : privKeyPath
            }`,
          );
        }

        const options: JwtModuleOptions = {
          publicKey: readFileSync(pubKeyPath),
          privateKey: readFileSync(privKeyPath),
          signOptions: {
            expiresIn: configService.get<string>('JWT_EXPIRES'),
            algorithm: 'RS256',
          },
        };
        return options;
      },
      global: true,
      inject: [ConfigService],
    }),
    CodeModule,
    OperatorModule,
    ShiftModule,
    MailModule,
  ],
  controllers: [],
  providers: [
    PrismaService,
    {
      provide: APP_INTERCEPTOR,
      useClass: ZodSerializerInterceptor,
    },
    {
      provide: APP_FILTER,
      useClass: HttpExceptionFilter,
    },
    {
      provide: APP_FILTER,
      useClass: SentryGlobalFilter,
    },
    {
      provide: APP_FILTER,
      useFactory: ({ httpAdapter }: HttpAdapterHost) => {
        return new PrismaClientExceptionFilter(httpAdapter, {
          // Prisma Error Code: HTTP Status Response
          P2000: HttpStatus.BAD_REQUEST,
          P2002: HttpStatus.CONFLICT,
          P2025: HttpStatus.NOT_FOUND,
        });
      },
      inject: [HttpAdapterHost],
    },
  ],
})
export class AppModule {}
