import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Observable } from 'rxjs';
import {BadRequestException} from "@nestjs/common/exceptions";
import {Knex} from "knex";
import {InjectConnection} from "nestjs-knex";
import {UserService} from "./user.service";

@Injectable()
export class UserInterceptor implements NestInterceptor {
  constructor(private readonly jwtService: JwtService, private readonly userService: UserService) {}
  async intercept(context: ExecutionContext, next: CallHandler): Promise<Observable<any>> {
    const req = context.switchToHttp().getRequest();
    const authHeader = req.headers.authorization;
    const token = authHeader?.split(' ')[1];
    if (!token) return next.handle();
    //DEV
    if (process.env.NODE_ENV === 'development' && token === process.env.DEV_JWT_TOKEN) {
      req['user'] = {
        id: 0,
        nickname: 'admin',
      };
      return next.handle();
    }
    try {
      const user = this.jwtService.verify(token);
      const banned = await this.userService.getUserBanState(user.id);
      if(!banned){
        req['user'] = user;
      }
    }
    catch (err){
      next.handle();
    }

    return next.handle();
  }
}
