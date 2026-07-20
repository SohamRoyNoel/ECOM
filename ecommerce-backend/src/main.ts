import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { ConfigService } from '@nestjs/config';
import { ValidationPipe } from '@nestjs/common';
import helmet from 'helmet';
import compression from 'compression';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    logger: ['log', 'warn', 'error'],
  });
  const config = app.get(ConfigService);

  app.set('trust proxy', 1);

  app.use(helmet());
  app.use(compression());

  const corsOrigins = config.get<string[]>('corsOrigins') || [];
  app.enableCors({
    origin: corsOrigins.length > 0 ? corsOrigins : false,
    credentials: true,
    methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  app.enableShutdownHooks();
  app.setGlobalPrefix(config.get('API_PREFIX') || "ecom/v1");
  const port = config.get<number>('port') || 3000;
  await app.listen(port, '0.0.0.0');
  console.log(`API listening on port ${port}`);
}

bootstrap();
