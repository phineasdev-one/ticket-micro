import * as bcrypt from 'bcrypt';
import { eq } from 'drizzle-orm';
import { JwtService } from '@nestjs/jwt';
import { ClientKafka } from '@nestjs/microservices';
import { DatabaseService, users } from '@app/database';
import { KAFKA_SERVICE, KAFKA_TOPICS } from '@app/kafka';
import {
  Inject,
  Injectable,
  OnModuleInit,
  ConflictException,
  UnauthorizedException,
} from '@nestjs/common';

@Injectable()
export class AuthServiceService implements OnModuleInit {
  constructor(
    @Inject(KAFKA_SERVICE) private readonly kafkaService: ClientKafka,
    private readonly dbService: DatabaseService,
    private readonly jwtService: JwtService,
  ) {}

  async onModuleInit() {
    // NOTE: connect to kafka when module initializes
    await this.kafkaService.connect();
  }

  async register(email: string, password: string, name: string) {
    const existingUser = await this.dbService.db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (existingUser.length > 0) {
      throw new ConflictException('User already exists');
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const [user] = await this.dbService.db
      .insert(users)
      .values({ email, password: hashedPassword, name })
      .returning();

    return { message: 'User registered successfully', userId: user.id };
  }

  async login(email: string, password: string) {
    const [user] = await this.dbService.db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (!user || !(await bcrypt.compare(password, user.password))) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const token = this.jwtService.sign({ sub: user.id, email: user.email });

    return {
      access_token: token,
      users: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    };
  }

  async getProfile(userId: string) {
    const [user] = await this.dbService.db
      .select({
        id: users.id,
        email: users.email,
        name: users.name,
        role: users.role,
      })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    return user;
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
