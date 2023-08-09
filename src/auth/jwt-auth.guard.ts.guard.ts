import { CanActivate, ExecutionContext, Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';
import { Observable } from 'rxjs';
import {Knex} from "knex";
import {InjectConnection} from "nestjs-knex";
import {ForbiddenException} from "@nestjs/common/exceptions";
import {UserService} from "../user/user.service";

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly jwtService: JwtService, private readonly userService: UserService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req: Request = context.switchToHttp().getRequest<Request>();

    try {
      const authHeader = req.headers.authorization;
      const bearer = authHeader?.split(' ')[0];
      const token = authHeader?.split(' ')[1];
      //DEV
      if (process.env.NODE_ENV === 'development' && token === process.env.DEV_JWT_TOKEN) {
        req['user'] = {
          id: 0,
          nickname: 'admin',
        };

        return true;
      }
      if (bearer !== 'Bearer' || !token) {
        throw new UnauthorizedException();
      }
      const user = this.jwtService.verify(token);
      const banned = await this.userService.getUserBanState(user.id);
      if(banned){
        throw new ForbiddenException({message: "User banned"});
      }
      req['user'] = user;
      return true;
    } catch (error) {
      throw new UnauthorizedException();
    }
  }
}
