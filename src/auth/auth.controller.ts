import {Body, Controller, Param, ParseUUIDPipe, Post, Query} from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { LogoutDto } from './dto/logout.dto';
import { RefreshDto } from './dto/refresh.dto';
import { RegisterDto } from './dto/register.dto';
import {ConfirmPasswordRecoverDto} from "./dto/confirm-password-recover.dto";
import {RequestPasswordRecoverDto} from "./dto/request-password-recover.dto";

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}
  @Post('register')
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Post('login')
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Post('logout')
  logout(@Body() dto: LogoutDto) {
    return this.authService.logout(dto);
  }
  @Post('refresh')
  refresh(@Body() dto: RefreshDto) {
    return this.authService.refresh(dto);
  }

  @Post('password_recover')
  requestPasswordRecover(@Body() dto: RequestPasswordRecoverDto) {
    return this.authService.requestPasswordRecover(dto);
  }
  @Post('password_confirm')
  confirmPasswordRecover(@Query("uuid", ParseUUIDPipe) uuid: string, @Body() dto: ConfirmPasswordRecoverDto) {
    return this.authService.confirmPasswordRecover(uuid, dto);
  }
}
