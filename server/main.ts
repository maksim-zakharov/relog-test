import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as jsonServer from 'json-server';
import * as compression from 'compression';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.use(compression());

  const router = jsonServer.router('db.json');
  const middlewares = jsonServer.defaults();

  app.use('/api', middlewares);
  app.use('/api', router);

  await app.listen(process.env.PORT || 4040);
}

bootstrap();
