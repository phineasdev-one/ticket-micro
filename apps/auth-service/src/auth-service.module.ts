import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { KafkaModule } from '@app/kafka';
import { JwtStrategy } from './jwt.strategy';
import { DatabaseModule } from '@app/database';
import { PassportModule } from '@nestjs/passport';
import { AuthServiceService } from './auth-service.service';
import { AuthServiceController } from './auth-service.controller';

@Module({
  imports: [
    KafkaModule.register('auth-service-group'),
    DatabaseModule,
    PassportModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'secret',
      signOptions: { expiresIn: '1d' },
    }),
  ],
  controllers: [AuthServiceController],
  providers: [AuthServiceService, JwtStrategy],
})
export class AuthServiceModule {}