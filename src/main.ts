import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { patchNestJsSwagger } from 'nestjs-zod';
import { PrismaService } from 'nestjs-prisma';
import { apiReference } from '@scalar/nestjs-api-reference';
import { AppModule } from './app.module';
import { Logger, LoggerErrorInterceptor } from 'nestjs-pino';
import * as cookieParser from 'cookie-parser';
import * as Sentry from '@sentry/nestjs';
import { nodeProfilingIntegration } from '@sentry/profiling-node';

patchNestJsSwagger();

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  patchNestJsSwagger();

  app.useLogger(app.get(Logger));
  app.useGlobalInterceptors(new LoggerErrorInterceptor());
  app.use(cookieParser());

  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    integrations: [nodeProfilingIntegration()],
    // Tracing must be enabled for profiling to work
    tracesSampleRate: 1.0,
    // Set sampling rate for profiling - this is evaluated only once per SDK.init call
    profilesSampleRate: 1.0,
  });

  const config = new DocumentBuilder()
    .setTitle('BOTTLE [CODE] Backend')
    .setDescription('The Bottle Code API description')
    .setVersion('1.0')
    .build();

  const document = SwaggerModule.createDocument(app, config); // serializable object - conform to OpenAPI
  SwaggerModule.setup('api', app, document, {
    swaggerUiEnabled: false,
  });

  app.use(
    '/api',
    apiReference({
      theme: 'kepler',
      darkMode: true,
      spec: {
        content: document,
      },
      title: 'BOTTLE [CODE] Backend API',
      slug: 'bottle-code',
      _integration: 'nestjs',
    }),
  );

  const prismaService: PrismaService = app.get(PrismaService);

  prismaService.$on('query', (event) => {
    console.log(event);
  });

  app.enableShutdownHooks();
  await app.listen(process.env.PORT ?? 3033);
}

void bootstrap();
