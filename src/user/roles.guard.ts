import {CanActivate, ExecutionContext, mixin, UnauthorizedException} from '@nestjs/common';
import {JwtService} from '@nestjs/jwt';
import {Request} from 'express';
import {Knex} from "knex";
import {InjectConnection} from "nestjs-knex";
import {ForbiddenException} from "@nestjs/common/exceptions";
import {RoleKeyType} from "./model/roles.type";

export const RolesGuard = (...allowedRoles: RoleKeyType[]) => {
  class RolesGuardMixin implements CanActivate {
    constructor(@InjectConnection() readonly knex: Knex, readonly jwtService: JwtService) {}

    async canActivate(context: ExecutionContext): Promise<boolean> {
      const req: Request = context.switchToHttp().getRequest<Request>();

      try {
        const authHeader = req.headers.authorization;
        const bearer = authHeader?.split(' ')[0];
        const token = authHeader?.split(' ')[1];
        if (bearer !== 'Bearer' || !token) {
          throw new UnauthorizedException();
        }
        const user = this.jwtService.verify(token);
        const candidate = await this.knex("person").select("role").where({id: user.id}).first();
      if(allowedRoles.includes(candidate.role)){
        req["role"] = candidate.role;
        return  true
      }
        return false;

      } catch (error) {
        throw new ForbiddenException();
      }
    }
  }

  return mixin(RolesGuardMixin);
}