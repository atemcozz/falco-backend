import { Injectable } from '@nestjs/common';
import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
  UnauthorizedException
} from '@nestjs/common/exceptions';
import { Knex } from 'knex';
import { InjectConnection } from 'nestjs-knex';
import { RegisterDto } from './dto/register.dto';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { LoginDto } from './dto/login.dto';
import { LogoutDto } from './dto/logout.dto';
import { RefreshDto } from './dto/refresh.dto';
import { ConfigService } from '@nestjs/config';
import { MailerService } from '@nestjs-modules/mailer/dist/mailer.service';
import * as userQueryHelpers from "../user/helpers/user-query-helpers"
import {v4 as uuidv4} from "uuid";
import {RequestPasswordRecoverDto} from "./dto/request-password-recover.dto";
import {ConfirmPasswordRecoverDto} from "./dto/confirm-password-recover.dto";
import { TokenUser } from "./model/token-user.type";
@Injectable()
export class AuthService {
  constructor(
    @InjectConnection() private readonly knex: Knex,
    private readonly jwtService: JwtService,
    private readonly mailerService: MailerService,
  ) {}
  async register(dto: RegisterDto) {
    const { name, surname, nickname, password, email } = dto;
    const nicknameCandidate = await this.knex('person').where({ nickname }).first();
    if (nicknameCandidate) {
      throw new BadRequestException({ message: 'Пользователь с таким никнеймом уже существует' });
    }
    const emailCandidate = await this.knex('person').where({ email }).first();
    if (emailCandidate) {
      throw new BadRequestException({ message: 'Пользователь с таким адресом эл. почты уже существует' });
    }
    const passwordHash = await bcrypt.hash(password, 10);
    const user = (
      await this.knex('person')
        .insert({
          name,
          surname,
          nickname,
          passwordhash: passwordHash,
          email,
        })
        .returning('*')
    )[0];
    const { accessToken, refreshToken } = this.generateJWT({
      id: user.id,
      nickname,
    });
    await this.saveRefreshToken(user.id, refreshToken);
    return { user, accessToken, refreshToken };
  }

  async login(dto: LoginDto) {
    const { login, password } = dto;
    const user = await this.knex('person')
        .where({ nickname: login.trim() })
        .orWhere({email: login.trim()})
        .first();
    if (!user) {
      throw new BadRequestException({ message: 'Неверный логин или пароль' });
    }
    const validPassword = await bcrypt.compare(password.trim(), user.passwordhash);
    if (!validPassword) {
      throw new BadRequestException({ message: 'Неверный логин или пароль' });
    }
    const banned = await this.knex("person_ban").where({user_id: user.id}).andWhereRaw("NOW() < expires_at").first();
    if(banned){
      const date= new Date(banned.expires_at);
      const fmtDate = date.toLocaleDateString('ru-RU', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      })
      let message = `Вы были временно заблокированы до ${fmtDate} за нарушение правил ресурса.\ `
      if(banned.message) message += `Причина блокировки: ${banned.message}`;
      throw new ForbiddenException({message});
    }
    const { accessToken, refreshToken } = this.generateJWT({
      id: user.id,
      nickname: user.nickname,
    });
    if (dto.refreshToken) {
      await this.removeRefreshToken(dto.refreshToken);
    }
    await this.saveRefreshToken(user.id, refreshToken);
    return { user, accessToken, refreshToken };
  }

  async logout(dto: LogoutDto): Promise<void> {
    const { refreshToken } = dto;
    if (!refreshToken) {
      throw new BadRequestException();
    }
    await this.removeRefreshToken(refreshToken);
  }

  async refresh(dto: RefreshDto) {
    const { refreshToken } = dto;
    if (!refreshToken) {
      throw new BadRequestException({ message: 'Token not found' });
    }
    const tokenUser = this.validateToken(refreshToken);
    const user = await this.knex('person').where({ id: tokenUser.id })
        .select(userQueryHelpers.publicColumns)
        .first();

    if (!user) {
      throw new NotFoundException({ message: 'User not found' });
    }
    const newTokens = this.generateJWT({
      id: tokenUser.id,
      nickname: tokenUser.nickname,
    });
    await this.removeRefreshToken(refreshToken);
    await this.saveRefreshToken(tokenUser.id, newTokens.refreshToken);

    return { user: user, ...newTokens };
  }

  async requestPasswordRecover(dto: RequestPasswordRecoverDto) {
    const { login } = dto;
    const user = await this.knex('person')
        .where({ email: login.trim() })
        .orWhere({nickname: login.trim()})
        .first();
    if (!user) {
      throw new NotFoundException({ message: 'Пользователь не найден' });
    }
    const uuid = uuidv4();
    await this.knex("password_reset").insert({
      user_id: user.id,
      uuid
    });
    return this.mailerService.sendMail({
      from: process.env.SMTP_USER,
      to: user.email,
      subject: '[Falco] Восстановление пароля',
      template: 'password-recovery',
      context: {
        link: `${process.env.CLIENT_HOST}/recover/password_change/?uuid=${uuid}`
      },
    });

  }
  async confirmPasswordRecover(uuid: string,dto: ConfirmPasswordRecoverDto){
    const { password } = dto;
    const record: any = await this.knex("password_reset")
        .where({uuid: uuid})
        .first();
    if(!record) throw new BadRequestException();
    const passwordHash = await bcrypt.hash(password, 10);
    await this.knex("person").update({"passwordhash": passwordHash}).where({id: record.user_id});
    await this.knex("password_reset").del().where({user_id: record.user_id})
    await this.removeAllRefreshTokens(record.user_id);
  }
  generateJWT(payload: object): { accessToken: string; refreshToken: string } {
    const accessToken = this.jwtService.sign(payload, {
      expiresIn: '24h',
    });
    const refreshToken = this.jwtService.sign(payload, {
      expiresIn: '30d',
    });
    return { accessToken, refreshToken };
  }
  async saveRefreshToken(user_id: number, token: string): Promise<void> {
    await this.knex('token').insert({ user_id, refresh_token: token });
  }
  async removeRefreshToken(token: string): Promise<void> {
    await this.knex('token').del().where({ refresh_token: token });
  }
  async removeAllRefreshTokens(user_id: number): Promise<void> {
    await this.knex('token').del().where({ user_id });
  }
  validateToken(token: string): TokenUser {
    try {
      return this.jwtService.verify(token)
    } catch (e) {
      throw new UnauthorizedException({ message: 'Token not found' });
    }
  }
}
