import { Controller, Post, Body } from '@nestjs/common';
import { AuthService } from './auth.service';
@Controller('auth')
export class AuthController {
  constructor(private svc: AuthService) {}
  @Post('register') register(@Body() b: { email: string; password: string }) { return this.svc.register(b.email, b.password); }
  @Post('login') login(@Body() b: { email: string; password: string }) { return this.svc.login(b.email, b.password); }
}
