import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module';
import { IoAdapter } from '@nestjs/platform-socket.io';
import { Server } from 'socket.io';
import { join } from 'path';
import { ValidationPipe } from '@nestjs/common';
import 'reflect-metadata';



// ✅ FIX: Prisma BigInt cannot be JSON-stringified by default
// This prevents 500 errors like: "Do not know how to serialize a BigInt"
(BigInt.prototype as any).toJSON = function () {
  return this.toString();
};

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  app.enableCors();
  app.useWebSocketAdapter(new IoAdapter(app));

  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

  app.useStaticAssets(join(process.cwd(), 'uploads'), { prefix: '/uploads' });

  const httpServer = app.getHttpServer();
  const io = new Server(httpServer, { cors: { origin: '*' } });
  app.set('io', io);

  const port = process.env.PORT || 3001;
  await app.listen(port);
  console.log(`API listening on http://localhost:${port}`);
}

bootstrap();
