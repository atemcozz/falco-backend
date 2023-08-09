import {IsNotEmpty, IsNumber, IsOptional, IsPositive, IsString} from "class-validator";

export class CreateCommentDto{
    @IsNotEmpty()
    @IsString()
    body: string;

    @IsNumber()
    @IsOptional()
    answer_to?: number;
}