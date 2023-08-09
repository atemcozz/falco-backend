import {
  Body,
  Controller,
  Delete,
  Get,
  NotFoundException,
  Param,
  Post,
  Put,
  UseGuards,
  UseInterceptors
} from '@nestjs/common';
import {ParseIntPipe} from "@nestjs/common/pipes";
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard.ts.guard';
import {CreateCommentDto} from "./dto/create-comment.dto";
import {Req} from "@nestjs/common/decorators/http/route-params.decorator";
import {CommentService} from "./comment.service";
import {UserJwtRequest} from "../user/user-jwt-request";
import {UserInterceptor} from "../user/user.interceptor";
@Controller('comment')
export class CommentController {
  constructor(private readonly commentService: CommentService) {
  }
  @Post('/post/:id')
  @UseGuards(JwtAuthGuard)
  createComment(@Body() dto: CreateCommentDto, @Param("id", ParseIntPipe) post_id, @Req() req) {
    return this.commentService.createComment(dto,post_id, req?.user?.id);
  }
  @Get('post/:id')
  @UseInterceptors(UserInterceptor)
  getCommentsByPost(@Param("id", ParseIntPipe) post_id: number,  @Req() req: UserJwtRequest) {
    return this.commentService.getCommentsByPost(post_id,  req?.user?.id);
  }

  @Get('/id/:id')
  @UseInterceptors(UserInterceptor)
  getCommentByID(@Param("id", ParseIntPipe) id: number,  @Req() req: UserJwtRequest) {
    return this.commentService.getCommentByID(id, req?.user?.id);
  }
  @Put('like/:id')
  @UseGuards(JwtAuthGuard)
  likeComment(@Param('id', ParseIntPipe) comment_id, @Req() req: UserJwtRequest): Promise<void>  {
    if(!comment_id) throw new NotFoundException();
    return this.commentService.likeComment(comment_id, req.user.id);
  }

  @Delete('/id/:id')
  @UseGuards(JwtAuthGuard)
  deleteComment(@Param("id", ParseIntPipe) id: number, @Req() req) {
    return this.commentService.deleteComment(id, req?.user?.id);
  }
}
