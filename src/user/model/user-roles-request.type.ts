import {UserJwtRequestType} from "./user-jwt-request.type";
import {RoleKeyType} from "./roles.type";

export interface UserRolesRequest extends UserJwtRequestType{
    role?: RoleKeyType,
}