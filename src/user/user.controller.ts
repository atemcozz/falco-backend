import {Controller, DefaultValuePipe, Delete, Get, ParseUUIDPipe, Post, Put, Query, UseGuards} from '@nestjs/common';
import { UseInterceptors } from '@nestjs/common/decorators/core/use-interceptors.decorator';
import { Body, Param, Req } from '@nestjs/common/decorators/http/route-params.decorator';
import { ForbiddenException } from '@nestjs/common/exceptions';
import { ParseIntPipe } from '@nestjs/common/pipes';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { UpdateProfileDto } from './dto/update-profile-dto';
import { UserJwtRequestType } from './model/user-jwt-request.type';
import { UserInterceptor } from './user.interceptor';
import { UserService } from './user.service';
import {UpdatePasswordDto} from "./dto/update-password-dto";
import {RequestEmailUpdateDto} from "./dto/request-email-update-dto";
import {NotificationService} from "./notification.service";
import {RolesGuard} from "./roles.guard";
import {RoleKeyType} from "./model/roles.type";
import {UserRolesRequest} from "./model/user-roles-request.type";

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService, private readonly  notificationService: NotificationService) {}
  @Get("id/:id")
  @UseInterceptors(UserInterceptor)
  getUserByID(@Param('id', ParseIntPipe) id, @Req() req?: UserJwtRequestType) {
    return this.userService.getUserByID(id, req.user?.id);
  }

  @Get('subscriptions/:id')
  @UseInterceptors(UserInterceptor)
  getUserSubscriptions(@Param('id', ParseIntPipe) id: number, @Req() req?: UserJwtRequestType) {
    return this.userService.getUserSubscriptions(id ,req?.user?.id);
  }

  @Get('subscribers/:id')
  @UseInterceptors(UserInterceptor)
  getUserSubscribers(@Param('id', ParseIntPipe) id: number, @Req() req?: UserJwtRequestType) {
    return this.userService.getUserSubscribers(id, req?.user?.id);
  }

  @Put('profile/:id')
  @UseGuards(JwtAuthGuard)
  updateProfile(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateProfileDto, @Req() req: UserJwtRequestType) {
    if (req.user?.id !== id) {
      throw new ForbiddenException();
    }
    return this.userService.updateProfile(dto, id);
  }
  @Put('/password')
  @UseGuards(JwtAuthGuard)
  updatePassword(@Body() dto: UpdatePasswordDto, @Req() req: UserJwtRequestType) {
    return this.userService.updatePassword(dto, req?.user?.id);
  }
  @Put("/email")
  @UseGuards(JwtAuthGuard)
  requestEmailUpdate(@Body() dto: RequestEmailUpdateDto, @Req() req: UserJwtRequestType) {
    return this.userService.requestEmailUpdate(dto, req?.user?.id);
  }
  @Get('/email_confirm')
  confirmEmailUpdate(@Query("uuid", ParseUUIDPipe) uuid: string) {
    return this.userService.confirmEmailUpdate(uuid);
  }

  @Delete('/delete/:id')
  @UseGuards(JwtAuthGuard)
  deleteUser(@Param('id', ParseIntPipe) id: number, @Req() req: UserJwtRequestType) {
    if (req.user?.id !== id) {
      throw new ForbiddenException();
    }
    return this.userService.deleteUser(id);
  }
  @Put('subscribe/:id')
  @UseGuards(JwtAuthGuard)
  subscribeUser(@Param('id', ParseIntPipe) id: number, @Req() req: UserJwtRequestType) {
    return this.userService.subscribeUser(req.user?.id, id);
  }
  @Post("/ban/:id")
  @UseGuards(JwtAuthGuard)
  @UseGuards(RolesGuard("moderator", "admin"))
  banUser(@Param("id", ParseIntPipe) id: number,
          @Body() dto,
          @Req() req: UserRolesRequest){
    return this.userService.banUser(id, req.role,dto);
  }
  @Get('/ban/:id')
  getUserBanState(@Param("id", ParseIntPipe) id: number) {
    return this.userService.getUserBanState(id);
  }
  @Get('/notifications_count')
  @UseGuards(JwtAuthGuard)
  getUnreadNotificationsCount(@Req() req: UserJwtRequestType) {
    return this.notificationService.getUnreadNotificationsCount(req?.user?.id);
  }
  @Get('/notifications')
  @UseGuards(JwtAuthGuard)
  getUserNotifications(@Req() req: UserJwtRequestType,
                       @Query("page", new DefaultValuePipe(1),ParseIntPipe) page?: number,
                       @Query("t") timestamp?: string) {
    return this.notificationService.getAllNotifications(req?.user?.id, {page, timestamp});
  }
}
