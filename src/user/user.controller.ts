import {Controller, Delete, Get, ParseUUIDPipe, Put, Query, UseGuards} from '@nestjs/common';
import { UseInterceptors } from '@nestjs/common/decorators/core/use-interceptors.decorator';
import { Body, Param, Req } from '@nestjs/common/decorators/http/route-params.decorator';
import { ForbiddenException } from '@nestjs/common/exceptions';
import { ParseIntPipe } from '@nestjs/common/pipes';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard.ts.guard';
import { UpdateProfileDto } from './dto/update-profile-dto';
import { UserJwtRequest } from './user-jwt-request';
import { UserInterceptor } from './user.interceptor';
import { UserService } from './user.service';
import {UpdatePasswordDto} from "./dto/update-password-dto";
import {RequestEmailUpdateDto} from "./dto/request-email-update-dto";

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}
  @Get("id/:id")
  @UseInterceptors(UserInterceptor)
  getUserByID(@Param('id', ParseIntPipe) id, @Req() req?: UserJwtRequest) {
    return this.userService.getUserByID(id, req.user?.id);
  }

  @Get('subscriptions/:id')
  getUserSubscriptions(@Param('id', ParseIntPipe) id: number) {
    return this.userService.getUserSubscriptions(id);
  }

  @Get('subscribers/:id')
  getUserSubscribers(@Param('id', ParseIntPipe) id: number) {
    return this.userService.getUserSubscribers(id);
  }

  @Put('profile/:id')
  @UseGuards(JwtAuthGuard)
  updateProfile(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateProfileDto, @Req() req: UserJwtRequest) {
    if (req.user?.id !== id) {
      throw new ForbiddenException();
    }
    return this.userService.updateProfile(dto, id);
  }
  @Put('/password')
  @UseGuards(JwtAuthGuard)
  updatePassword(@Body() dto: UpdatePasswordDto, @Req() req: UserJwtRequest) {
    return this.userService.updatePassword(dto, req?.user?.id);
  }
  @Put("/email")
  @UseGuards(JwtAuthGuard)
  requestEmailUpdate(@Body() dto: RequestEmailUpdateDto, @Req() req: UserJwtRequest) {
    return this.userService.requestEmailUpdate(dto, req?.user?.id);
  }
  @Get('/email_confirm')
  confirmEmailUpdate(@Query("uuid", ParseUUIDPipe) uuid: string) {
    return this.userService.confirmEmailUpdate(uuid);
  }

  @Delete('/delete/:id')
  @UseGuards(JwtAuthGuard)
  deleteUser(@Param('id', ParseIntPipe) id: number, @Req() req: UserJwtRequest) {
    if (req.user?.id !== id) {
      throw new ForbiddenException();
    }
    return this.userService.deleteUser(id);
  }
  @Put('subscribe/:id')
  @UseGuards(JwtAuthGuard)
  subscribeUser(@Param('id', ParseIntPipe) id: number, @Req() req: UserJwtRequest) {
    return this.userService.subscribeUser(req.user?.id, id);
  }
  @Get('/ban/:id')
  getUserBanState(@Param("id", ParseUUIDPipe) id: number) {
    return this.userService.getUserBanState(id);
  }
}
