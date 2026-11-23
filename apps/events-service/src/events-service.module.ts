import { Module } from '@nestjs/common';
import { KafkaModule } from '@app/kafka';
import { DatabaseModule } from '@app/database';
import { EventsServiceService } from './events-service.service';
import { EventsServiceController } from './events-service.controller';

@Module({
  imports: [KafkaModule.register('events-service-group'), DatabaseModule],
  controllers: [EventsServiceController],
  providers: [EventsServiceService],
})
export class EventsServiceModule {}
