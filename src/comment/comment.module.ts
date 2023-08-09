import { Module } from '@nestjs/common';
import { CommentController } from './comment.controller';
import { CommentService } from './comment.service';
import {AuthModule} from "../auth/auth.module";
import {UserModule} from "../user/user.module";
import {UserService} from "../user/user.service";

@Module({
  imports: [AuthModule, UserModule],
  controllers: [CommentController],
  providers: [CommentService, UserService],
})
export class CommentModule {}
