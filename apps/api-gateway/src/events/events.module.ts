import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { CommonModule } from '@app/common';
import { EventsService } from './events.service';
import { EventsController } from './events.controller';

@Module({
  imports: [HttpModule, CommonModule],
  controllers: [EventsController],
  providers: [EventsService],
})
export class EventsModule {}
