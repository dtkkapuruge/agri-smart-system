import { Body, Controller, Post } from '@nestjs/common';
import { AppService } from './app.service';

@Controller('auth') // අපේ API එක පටන් ගන්නේ http://localhost:3000/auth කියලා
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Post('signup') // Signup පාර: http://localhost:3000/auth/signup
  async signup(@Body() signUpData: any) {
    return this.appService.signup(signUpData);
  }
}