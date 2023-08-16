import {Injectable} from "@nestjs/common";
import {InjectConnection} from "nestjs-knex";
import {Knex} from "knex";
import {BadRequestException} from "@nestjs/common/exceptions";
import {POSTS_ON_PAGE} from "../post/const/post-const";
import {NOTIFICATIONS_ON_PAGE} from "./const/notification-const";
@Injectable()
export class NotificationService {
    constructor(@InjectConnection() private readonly knex: Knex) {}

    async getUnreadNotificationsCount(user_id: number){
        return this.knex("notification").count().where({target_id:user_id, read: false}).first();
    }
    async getAllNotifications(user_id: number, options?: {page?: number, timestamp?: string}){
        const {page, timestamp} = options;
        const query = this.knex('v_notification AS notification')
            .select("notification.*", this.knex.raw('COUNT(*) OVER() AS not_count'))
            .where({target_id: user_id});
        if (page && page > 0) {
            query.offset(NOTIFICATIONS_ON_PAGE * (page - 1)).limit(NOTIFICATIONS_ON_PAGE);
        }
        if(timestamp){
            query.where("notification.created_at", "<", this.knex.raw(`to_timestamp(?)`, [timestamp]));
        }
        const notifications = await query;
        const not_count = notifications[0]?.not_count || 0;
        const pages_count = Math.ceil(not_count / NOTIFICATIONS_ON_PAGE);
        const not_set = {pages_count, contents: notifications};

        await this.knex("notification").update({read: true}).where({target_id: user_id});
        return not_set;
    }
    async sendLikeNotification(sender_id: number, post_id: number, proceed: boolean = true){
        if(!post_id) throw new BadRequestException();
        if(!proceed){
            return this.knex("notification")
                .del()
                .where({sender_id, type: "post_like"})
                .andWhereRaw("payload->> 'post_id' = ?", [post_id])
        }
        const post = await this.knex("post").where({id: post_id}).first();
        if(sender_id === post.user_id) return;
        return this.knex("notification").insert({
            type: "post_like",
            sender_id,
            target_id: post.user_id,
            payload : { post_id, post_title: post.title}
        });
    }
    async sendReplyNotification(sender_id: number,  comment_id: number, answer_to: number){
        const comment = await this.knex("comment").where({id: answer_to}).first();
        if(!comment) throw new BadRequestException();
        if(sender_id === comment.user_id) return;
        return this.knex("notification").insert({
            type: "reply",
            sender_id,
            target_id: comment.user_id,
            payload : { post_id: comment.post_id, answer_to, comment_id}
        });
    }
    async sendCommentNotification(sender_id: number, comment_id: number, post_id: number){
        const post = await this.knex("post").where({id: post_id}).first();
        if(!post) throw new BadRequestException();
        if(sender_id === post.user_id) return;
        return this.knex("notification").insert({
            type: "comment",
            sender_id,
            target_id: post.user_id,
            payload : { post_id, post_title: post.title ,comment_id: comment_id}
        });
    }
    async sendSubscribeNotification(sender_id: number, target_id: number, proceed: boolean = true){
        if(!target_id) throw new BadRequestException();
        if(!proceed){
            return this.knex("notification").del().where({ sender_id, target_id, type: "subscription"});
        }
        return this.knex("notification").insert({
            type: "subscription",
            sender_id,
            target_id,
        });
    }
}