import {IsNotEmpty} from "class-validator";

export class RequestPasswordRecoverDto {
    @IsNotEmpty()
    login: string
}