import { KAFKA_SERVICE, KAFKA_TOPICS } from '@app/kafka';
import { ClientKafka } from '@nestjs/microservices';
import { Injectable, OnModuleInit, Inject } from '@nestjs/common';

@Injectable()
export class AuthServiceService implements OnModuleInit {
  constructor(
    @Inject(KAFKA_SERVICE) private readonly kafkaService: ClientKafka,
  ) {}

  async onModuleInit() {
    // NOTE: connect to kafka when module initializes
    await this.kafkaService.connect();
  }

  getHello(): string {
    return 'Hello from AuthService!';
  }

  async simulateUserRegistration(email: string) {
    //NOTE: publish event to kafka
    await this.kafkaService.emit(KAFKA_TOPICS.USER_REGISTERED, {
      email,
      timestamp: Date.now(),
    });

    return { message: true, info: `User registered with email: ${email}` };
  }
}
