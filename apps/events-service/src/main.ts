import { NestFactory } from '@nestjs/core';
import { SERVICE_PORTS } from '@app/common';
import { ValidationPipe } from '@nestjs/common';
import { EventsServiceModule } from './events-service.module';

async function bootstrap() {
  const app = await NestFactory.create(EventsServiceModule);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  await app.listen(SERVICE_PORTS.EVENTS_SERVICE);
  console.log(
    `Event Service is running on port ${SERVICE_PORTS.EVENTS_SERVICE}`,
  );
}
bootstrap();
