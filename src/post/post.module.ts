import { Module } from '@nestjs/common';
import { InjectConnection } from 'nestjs-knex';
import { AuthModule } from 'src/auth/auth.module';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { PostController } from './post.controller';
import { PostService } from './post.service';
import {UserModule} from "../user/user.module";
import {UserService} from "../user/user.service";

@Module({
  imports: [AuthModule, UserModule],
  controllers: [PostController],
  providers: [PostService, UserService],
})
export class PostModule {}
