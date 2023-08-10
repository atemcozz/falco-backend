import { BadRequestException, Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { Knex } from 'knex';
import { InjectConnection } from 'nestjs-knex';
import { AuthService } from 'src/auth/auth.service';
import { GetUserDto } from './dto/get-user.dto';
import { UpdateProfileDto } from './dto/update-profile-dto';
import * as bcrypt from 'bcrypt';
import { mutateObjectAsync } from 'src/utils/mutate-object';
import {ForbiddenException} from "@nestjs/common/exceptions";
import {RequestEmailUpdateDto} from "./dto/request-email-update-dto";
import {v4 as uuidv4} from "uuid";
import {MailerService} from "@nestjs-modules/mailer/dist";
import * as path from "path";
import {UpdatePasswordDto} from "./dto/update-password-dto";
import * as userQueryHelpers from "./helpers/user-query-helpers";
@Injectable()
export class UserService {
  constructor(@InjectConnection() private readonly knex: Knex, private readonly authService: AuthService, private readonly mailerService: MailerService) {}

  async getUserByID(id: number, sender_id?: number) {
    if (!id) {
      throw new BadRequestException({ message: 'Необходим ID пользователся' });
    }
    const query =  this.knex('v_person AS person')
        .select("person.*")
        .where({"person.id": id })
        .first();
    if(sender_id){
      query.select(this.knex.raw("EXISTS(SELECT FROM person_subscription where subject_id = ? AND object_id = ?) AS subscribed", [sender_id, id]));
    }
    const user = await query;
    if (!user) {
      throw new NotFoundException({ message: 'Пользователь не найден' });
    }
    return user;
  }
  async getUserSubscriptions(user_id: number, sender_id?: number) {
    const user = await this.knex('person').where({ id: user_id }).first();
    if (!user) {
      throw new NotFoundException({ message: 'Пользователь не найден' });
    }
    const query =  this.knex('person_subscription AS sub')
        .select("person.id", "person.nickname", "person.avatar_url")
        .where({
      subject_id: user_id,
    })
        .leftJoin("person", "person.id", "sub.object_id");
    if(sender_id){
      query.select(this.knex.raw("EXISTS(SELECT FROM person_subscription where subject_id = ? AND object_id = sub.object_id) AS subscribed", [sender_id]))
    }
    const subscriptions = await query;

    return subscriptions;
  }

  async getUserSubscribers(user_id: number, sender_id?:number) {
    const user = await this.knex('person').where({ id: user_id }).first();
    if (!user) {
      throw new NotFoundException({ message: 'Пользователь не найден' });
    }
    const query =  this.knex('person_subscription AS sub')
        .select("person.id", "person.nickname", "person.avatar_url")
        .where({
          object_id: user_id,
        })
        .leftJoin("person", "person.id", "sub.subject_id");
    if(sender_id){
      query.select(this.knex.raw("EXISTS(SELECT FROM person_subscription where subject_id = ? AND object_id = sub.subject_id) AS subscribed", [sender_id]))
    }
    const subscribers = await query;

    return subscribers;
  }

  async updateProfile(dto: UpdateProfileDto, user_id: number) {
    if(dto.nickname){
      const candidate = await this.knex('person').where({ nickname: dto.nickname }).first();
      if(candidate && candidate.id !== user_id){
        throw new ConflictException({ message: 'Пользователь с таким никнеймом уже существует' });
      }
    }
    const user_set = await this.knex("person").update(dto).where({ id: user_id })
        .returning(userQueryHelpers.publicColumns);

    return user_set[0];
  }
  async updatePassword(dto: UpdatePasswordDto, user_id: number): Promise<void> {
    const user = await this.knex("person").where({id: user_id}).first();
    const oldPassExists = await bcrypt.compare(dto.old_password, user.passwordhash);
    if(!oldPassExists) throw new BadRequestException({message: "Неверный старый пароль"});

    await this.authService.removeAllRefreshTokens(user_id);
    const passwordHash = await bcrypt.hash(dto.password, Number(process.env.BCRYPT_SALT));
    await this.knex("person").update({"passwordhash": passwordHash}).where({id: user_id});
  }
  async requestEmailUpdate(dto: RequestEmailUpdateDto, user_id: number) {
    const user = await this.knex("person").where({id: user_id}).first();
    if(!user) throw new NotFoundException();

    const existingEmail = await this.knex("person").where({email: dto.email}).first();
    if(existingEmail) throw new ConflictException();
    const uuid = uuidv4();
    await this.knex("email_confirm").insert({
      user_id,
      uuid,
      candidate: dto.email,
    })
    const link = `${process.env.EXTERNAL_HOST}/api/user/email_confirm/?uuid=${uuid}`;
    await this.mailerService.sendMail({
      from: process.env.SMTP_USER,
      to: dto.email,
      subject: '[Falco] Подтверждение адреса электронной почты',
      template: "email-confirm",
      context: {
        link: link,
      },
    });

  }
  async confirmEmailUpdate( uuid: string): Promise<string> {
    const confirm = await this
        .knex("email_confirm")
        .where("email_confirm.uuid", uuid)
        .first();
    if(!confirm){
      throw new NotFoundException();
    }
    await this.knex("person").where({id: confirm.user_id}).update({email: confirm.candidate});
    await  this.knex("email_confirm").del().where("email_confirm.uuid", uuid);
    return "Адрес электронной почты успешно изменен";
  }
  async deleteUser(user_id: number): Promise<void> {
    const user = this.knex('person').where({ id: user_id }).first();
    if (!user) {
      throw new NotFoundException({ message: 'Пользователь не найден' });
    }
    await this.knex('person').del().where({ id: user_id });
  }
  async subscribeUser(subject_id: number, object_id: number): Promise<void> {
    const subscription = await this.knex('person_subscription').where({ subject_id: subject_id, object_id }).first();
    if (subscription) {
      await this.knex('person_subscription').del().where({ subject_id: subject_id, object_id });
    } else {
      await this.knex('person_subscription').insert({
        subject_id: subject_id,
        object_id,
      });
    }
  }
  async getUserBanState(id: number){
    return this.knex("person_ban")
        .where({user_id: id})
        .andWhereRaw("NOW() < expires_at")
        .first();
  }
}
