import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { patchNestJsSwagger } from 'nestjs-zod';
import { PrismaService } from 'nestjs-prisma';

patchNestJsSwagger();

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const config = new DocumentBuilder()
    .setTitle('CIDER [CODE] Backend')
    .setDescription('The Cider Code API description')
    .setVersion('1.0')
    .addTag('cider')
    .build();
  const documentFactory = () => SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, documentFactory, {
    jsonDocumentUrl: 'api/json',
  });
  patchNestJsSwagger();

  const prismaService: PrismaService = app.get(PrismaService);

  prismaService.$on('query', (event) => {
    console.log(event);
  });

  app.enableShutdownHooks();
  await app.listen(process.env.PORT ?? 3000);
}

bootstrap();
