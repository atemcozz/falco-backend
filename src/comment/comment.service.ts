import {Delete, Get, Injectable, NotFoundException, Post} from '@nestjs/common';
import {InjectConnection} from "nestjs-knex";
import {Knex} from "knex";
import {CreateCommentDto} from "./dto/create-comment.dto";
import {Req} from "@nestjs/common/decorators/http/route-params.decorator";
import {ForbiddenException, UnauthorizedException} from "@nestjs/common/exceptions";
import * as userQueryHelpers from "../user/helpers/user-query-helpers";
@Injectable()
export class CommentService {
    constructor(@InjectConnection() private readonly knex: Knex){}
    async createComment(dto: CreateCommentDto, post_id: number, user_id: number): Promise<Comment>  {
        const post = await this.knex("post").where({id: post_id}).first();
        if(!post) throw new NotFoundException();

        const comment_set: Comment[] = await this.knex<Comment>("comment")
            .insert({
                user_id,
                post_id,
                body: dto.body,
                answer_to: dto.answer_to })
            .returning("*");

        return comment_set[0];
    }
    async getCommentByID(id: number, sender_id?: number): Promise<Comment>  {
        const query = this.knex<Comment>("v_comment AS comment")
            .select("comment.*")
            .where({id})
            .first()

        if(sender_id){
            query.select( this.knex.raw(
                `EXISTS(SELECT * FROM comment_like WHERE user_id = ? AND comment_id = comment.id) AS user_like`, [sender_id]))
        }
        return  query;
    }

   async getCommentsByPost(post_id: number, sender_id?: number): Promise<Comment[]> {
       const query = this.knex<Comment>("v_comment AS comment")
           .select("comment.*")
           .where({post_id})
       if(sender_id){
           query.select( this.knex.raw(
               `EXISTS(SELECT * FROM comment_like WHERE user_id = ? AND comment_id = comment.id) AS user_like`, [sender_id]))
       }
       return  query;
    }
    async likeComment(comment_id: number, sender_id: number): Promise<void> {
        if (!sender_id) {
            throw new UnauthorizedException();
        }
        const liked = await this.knex('comment_like')
            .where({
                user_id: sender_id,
                comment_id,
            })
            .first();

        if (liked) {
            await this.knex('comment_like').del().where({
                user_id: sender_id,
                comment_id,
            });
        } else {
            await this.knex('comment_like').insert({user_id: sender_id,comment_id});
        }
    }
    async deleteComment(comment_id: number, user_id: number) {
        const ownedComment = await this.knex("comment").where({id: comment_id, user_id}).first();
        if(!ownedComment) throw new ForbiddenException();
        await this.knex("comment").del().where({id: comment_id, user_id});
    }
}
