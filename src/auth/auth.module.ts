import { MailerModule, MailerService } from '@nestjs-modules/mailer/dist';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { JwtService } from '@nestjs/jwt/dist';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './jwt-auth.guard';

@Module({
  imports: [
    JwtModule.register({
      secret: process.env["JWT_SECRET"] || 'SECRET',
      signOptions: {
        expiresIn: '24h',
      },
    }),
    MailerModule,
  ],
  controllers: [AuthController],
  providers: [AuthService],
  exports: [JwtModule, AuthService],
})
export class AuthModule {}
