import { IsEmail, IsNotEmpty, MinLength, IsUrl, MaxLength, NotContains, IsString, IsOptional } from 'class-validator';

export class RegisterDto {
  @IsNotEmpty()
  @IsEmail({}, { message: 'Некорректный адрес эл. почты' })
  @IsString()
  email: string;

  @IsNotEmpty()
  @MinLength(5, { message: 'Слишком короткий никнейм' })
  @MaxLength(32, { message: 'Слишком длинный никнейм' })
  @NotContains(' ', { message: 'Никнейм не может содержать пробелы' })
  @IsString()
  nickname: string;

  @IsNotEmpty()
  @MinLength(8, { message: 'Слишком короткий пароль' })
  @MaxLength(64, { message: 'Слишком длинный пароль' })
  @IsString()
  password: string;

  @IsNotEmpty()
  @MinLength(2, { message: 'Слишком короткое имя' })
  @MaxLength(32, { message: 'Слишком длинное имя' })
  @IsString()
  name: string;

  @IsNotEmpty()
  @MinLength(2, { message: 'Слишком короткая фамилия' })
  @MaxLength(32, { message: 'Слишком длинная фамилия' })
  @IsString()
  surname: string;

  @IsUrl({}, { message: 'Некорректный адрес аватара' })
  @IsString()
  @IsOptional()
  avatarUrl?: string;
}
