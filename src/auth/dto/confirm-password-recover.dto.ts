import {IsNotEmpty, IsString, MaxLength, MinLength} from "class-validator";

export class ConfirmPasswordRecoverDto {
    @IsNotEmpty()
    @MinLength(8, { message: 'Пароль слишком короткий' })
    @MaxLength(64, { message: 'Пароль слишком длинный' })
    @IsString()
    password: string
}