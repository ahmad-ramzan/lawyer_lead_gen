import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { rawBody: true });
  app.setGlobalPrefix('api/v1');
  app.enableCors({ origin: process.env.FRONTEND_URL || 'http://localhost:3000' });
  await app.listen(3001);
  console.log('Backend running on http://localhost:3001');
}
bootstrap();
