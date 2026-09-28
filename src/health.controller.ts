import { Controller, Get } from '@nestjs/common';
@Controller('health')
export class HealthController {
  @Get() ok() { return { ok: true, service: 'mera-api', time: new Date().toISOString() }; }
}
@Controller()
export class RootController {
  @Get() root() { return { service: 'mera-api', ok: true, health: '/api/health' }; }
}
