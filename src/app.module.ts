import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UserModule } from './user/user.module';
import { AuthModule } from './auth/auth.module';
import { PostModule } from './post/post.module';
import { CommentModule } from './comment/comment.module';
import { KnexModule } from 'nestjs-knex';
import { MailerModule } from '@nestjs-modules/mailer';
import { HandlebarsAdapter } from '@nestjs-modules/mailer/dist/adapters/handlebars.adapter';
import * as path from "path";
@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: `config/local.env`,
    }),
    KnexModule.forRoot({
      config: {
        client: 'pg',
        connection: {
          host: process.env["DATABASE_HOST"],
          port: Number(process.env["DATABASE_PORT"]),
          user: process.env["DATABASE_USER"],
          password: process.env["DATABASE_PASSWORD"],
          database: process.env["DATABASE_NAME"],
        },
      },
    }),
    MailerModule.forRoot({
      transport: {
        port: Number(process.env.SMTP_PORT),
        host: process.env.SMTP_HOST,
        secure: false,
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASSWORD,
        },
      },
      template: {
        dir: path.resolve(__dirname, "template"),
        adapter: new HandlebarsAdapter(),
      },
    }),
    UserModule,
    AuthModule,
    PostModule,
    CommentModule,
  ],
  controllers: [AppController],
  providers: [AppService],
  exports: [],
})
export class AppModule {}
