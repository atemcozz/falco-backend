import { Module } from '@nestjs/common';
import { AuthModule } from 'src/auth/auth.module';

import { UserController } from './user.controller';
import { UserService } from './user.service';
import {MailerModule} from "@nestjs-modules/mailer/dist";
import {NotificationService} from "./notification.service";

@Module({
  imports: [AuthModule, MailerModule],
  controllers: [UserController],
  providers: [UserService, NotificationService],
  exports: [NotificationService]
})
export class UserModule {}
