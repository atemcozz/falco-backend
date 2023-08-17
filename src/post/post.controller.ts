import {
  Controller, DefaultValuePipe,
  NotFoundException,
  ParseArrayPipe,
  ParseIntPipe,
  Post,
  Req,
  UseGuards,
  UseInterceptors
} from '@nestjs/common';
import { Inject } from '@nestjs/common/decorators';
import { Delete, Get, Put } from '@nestjs/common/decorators/http/request-mapping.decorator';
import { Body, Param, Query } from '@nestjs/common/decorators/http/route-params.decorator';
import { Request } from 'express';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard.ts.guard';
import { UserJwtRequest } from 'src/user/user-jwt-request';
import { UserInterceptor } from 'src/user/user.interceptor';
import { CreatePostDto } from './dto/create-post.dto';
import { PostService } from './post.service';
import {JwtService} from "@nestjs/jwt";
import {ForbiddenException} from "@nestjs/common/exceptions";
@Controller('post')
export class PostController {
  constructor(private readonly postService: PostService) {}
  @Post()
  @UseGuards(JwtAuthGuard)
  createPost(@Req() req: UserJwtRequest, @Body() dto: CreatePostDto): Promise<Post> {
    return this.postService.createPost(dto, req.user.id);
  }
  @Get(['', 'new'])
  @UseInterceptors(UserInterceptor)
  getPosts(@Req() req: UserJwtRequest,
           @Query('tags', new DefaultValuePipe([]),ParseArrayPipe) tags?: string[],
           @Query('sort') sort?: string,
           @Query("page", new DefaultValuePipe(1),ParseIntPipe) page?: number,
           @Query("user_id", new DefaultValuePipe(1),ParseIntPipe) user_id?: number,
           @Query("search") search?: string,
           @Query("t") timestamp?: string){
    return this.postService.getPosts({ sort, tags, user_id, page, timestamp, search },req.user?.id);
  }
  @Get('feed')
  @UseGuards(JwtAuthGuard)
  getFeedPosts(@Req() req: UserJwtRequest,
               @Query("page", new DefaultValuePipe(1), ParseIntPipe) page?: number,
               @Query("t") timestamp?: string){
    return this.postService.getFeedPosts({page, timestamp}, req?.user?.id);
  }


  @Get('saved')
  @UseGuards(JwtAuthGuard)
  getSavedPosts(@Req() req: UserJwtRequest) {
    if(!req.user?.id) throw new ForbiddenException();
    return this.postService.getSavedPosts(req.user?.id);
  }

  @Get(':id')
  @UseInterceptors(UserInterceptor)
  getPostByID(@Param('id', ParseIntPipe) post_id: number, @Req() req: UserJwtRequest) {
    if(!post_id) throw new NotFoundException();
    return this.postService.getPostByID(post_id, req.user?.id);
  }
  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  deletePostByID(@Param('id', ParseIntPipe) post_id, @Req() req: UserJwtRequest): Promise<void> {
    if(!post_id) throw new NotFoundException();
    return this.postService.deletePostByID(post_id, req.user?.id);
  }

  @Put('like/:id')
  @UseGuards(JwtAuthGuard)
  likePost(@Param('id', ParseIntPipe) post_id, @Req() req: UserJwtRequest): Promise<void>  {
    if(!post_id) throw new NotFoundException();
    return this.postService.likePost(post_id, req.user.id);
  }

  @Put('save/:id')
  @UseGuards(JwtAuthGuard)
  savePost(@Param('id', ParseIntPipe) post_id, @Req() req: UserJwtRequest): Promise<void>  {
    if(!post_id) throw new NotFoundException();
    return this.postService.savePost(post_id, req.user?.id);
  }
}
