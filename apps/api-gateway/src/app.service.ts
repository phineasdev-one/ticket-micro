import { Injectable } from '@nestjs/common';
import { SERVICES } from '@app/common';

@Injectable()
export class AppService {
  getHello(): string {
    return `API Gateway is running on port`;
  }
}
