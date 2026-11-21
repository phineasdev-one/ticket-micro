import { Injectable } from '@nestjs/common';
import { SERVICES, SERVICES_PORTS } from '@app/common';

@Injectable()
export class AppService {
  getHello(): string {
    return `API Gateway is running on port ${SERVICES_PORTS[SERVICES.API_GATEWAY]}`;
  }
}
