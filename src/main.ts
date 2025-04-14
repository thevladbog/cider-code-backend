import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { patchNestJsSwagger } from 'nestjs-zod';
import { PrismaService } from 'nestjs-prisma';
import { apiReference } from '@scalar/nestjs-api-reference';

patchNestJsSwagger();

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  patchNestJsSwagger();

  const config = new DocumentBuilder()
    .setTitle('CIDER [CODE] Backend')
    .setDescription('The Cider Code API description')
    .setVersion('1.0')
    .addTag('cider')
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
      title: 'CIDER [CODE] Backend API',
      slug: 'cider-code',
      _integration: 'nestjs',
    }),
  );

  const prismaService: PrismaService = app.get(PrismaService);

  prismaService.$on('query', (event) => {
    console.log(event);
  });

  app.enableShutdownHooks();
  await app.listen(process.env.PORT ?? 3000);
}

bootstrap();
