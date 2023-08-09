import {IsEmail, IsNotEmpty, IsString, MaxLength, MinLength} from "class-validator";

export class RequestEmailUpdateDto {
    @IsString()
    @IsNotEmpty()
    @IsEmail()
    email: string
}