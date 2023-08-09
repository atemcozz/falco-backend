import {IsNotEmpty, IsString, MaxLength, MinLength} from "class-validator";

export class UpdatePasswordDto{
    @IsString()
    @IsNotEmpty()
    old_password: string;
    @MinLength(8, { message: 'Пароль слишком короткий' })
    @MaxLength(64, { message: 'Пароль сликом длинный' })
    @IsString()
    @IsNotEmpty()
    password: string;
}