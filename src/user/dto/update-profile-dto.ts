import {
  IsEmail,
  IsNotEmpty,
  MinLength,
  IsUrl,
  MaxLength,
  NotContains,
  IsString,
  IsOptional,
  IsNumber, IsInt, IsPositive,
    Max,
    Min
} from 'class-validator';



export class UpdateProfileDto {
  @MinLength(5, { message: 'Никнейм слишком короткий' })
  @MaxLength(32,{ message: 'Нийнейм слишком длинный' } )
  @NotContains(' ', { message: 'Никнейм не может содержать пробелы' })
  @IsString()
  @IsOptional()
  nickname?: string;

  @MinLength(2, { message: 'Имя слишком короткое' })
  @MaxLength(32,{ message: 'Имя слишком длинное' } )
  @IsString()
  @IsOptional()
  name?: string;

  @MinLength(2, { message: 'Фамилия слишком короткая' })
  @MaxLength(32,{ message: 'Фамилия слишком длинная' } )
  @IsString()
  @IsOptional()
  surname?: string;

  @IsUrl({}, { message: 'Некорректный адрес аватара' })
  @IsString()
  @IsOptional()
  avatar_url?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(2)
  sex?: number;

  @IsOptional()
  @IsNotEmpty()
  @MaxLength(255)
  country?: string;
}
