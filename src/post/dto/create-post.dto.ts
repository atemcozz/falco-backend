import { IsNotEmpty, IsOptional, IsUrl } from 'class-validator';

export class CreatePostDto {
  @IsNotEmpty({ message: 'Необходимо название поста' })
  title: string;
  @IsNotEmpty({ message: 'Необходима заглавная иллюстрация поста' })
  @IsUrl({}, { message: 'Некорректный адрес иллюстрации' })
  preview: string;
  @IsNotEmpty({ message: 'Пост не может быть пустым' })
  content: any;
  @IsOptional()
  tags?: string[];
}
