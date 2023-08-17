import {Injectable} from '@nestjs/common';
import {
    BadRequestException,
    ForbiddenException,
    NotFoundException,
    UnauthorizedException,
} from '@nestjs/common/exceptions';
import { Knex} from 'knex';
import {InjectConnection} from 'nestjs-knex';
import {CreatePostDto} from './dto/create-post.dto';


import {POSTS_ON_PAGE} from "./const/post-const";
import {NotificationService} from "../user/notification.service";
import {GetPostsQueries} from "./model/get-posts-queries.interface";

@Injectable()
export class PostService {
    constructor(@InjectConnection() private readonly knex: Knex, private readonly notificationService: NotificationService) {
    }

    async getPosts(queries: GetPostsQueries = {}, sender_id?: number) {
        const posts = await this.getPostsQuery(queries, sender_id);
        const posts_count = posts[0]?.posts_count || 0;
        const pages_count = Math.ceil(posts_count / POSTS_ON_PAGE);
        const post_set: PostSet = {pages_count, contents: posts};
        return post_set;
    }
    async getPostByID(post_id: number, sender_id?: number): Promise<Post> {
        const post: Post = await this.getPostsQuery({id: post_id}, sender_id).first();
        if (!post) {
            throw new NotFoundException();
        }
        return post;
    }
    async getFeedPosts(options: { page?: number, timestamp?: string } = {}, user_id: number ){
        const {page, timestamp} = options;
        const userExists = await this.knex("person").where({id: user_id}).first();
        if(!userExists) throw new NotFoundException();
        const posts = await this.getPostsQuery({page, timestamp}, user_id)
            .leftJoin("person_subscription", "person_subscription.object_id", "post.user_id")
            .where({"person_subscription.subject_id": user_id});
        const posts_count = posts[0]?.posts_count || 0;
        const pages_count = Math.ceil(posts_count / POSTS_ON_PAGE);
        const post_set: PostSet = {pages_count, contents: posts};
        return post_set;
    }
    async createPost(dto: CreatePostDto, user_id: number): Promise<Post> {
        const {title, content, tags, preview} = dto;
        const post_id: number =
            await this.knex<Post>('post')
                .insert({
                    user_id,
                    title: title.trim(),
                    content: JSON.stringify(content),
                    preview: preview,
                })
                .returning('id')
                .then(set => set[0].id);
        if (tags?.length > 0) {
            const tagsRows = tags
                .filter((tag) => tag.trim().length > 0)
                .map((tag) => ({
                    post_id,
                    tag: tag.toLowerCase(),
                }));
            await this.knex('post_tag').insert(tagsRows);
        }
        return this.getPostsQuery().where({"post.id": post_id}).first();
    }

    async getSavedPosts(user_id: number): Promise<PostSet> {
        const posts: Post[] = await this.getPostsQuery({}, user_id)
            .leftJoin("bookmark", "bookmark.post_id", "post.id")
            .where("bookmark.user_id", user_id);
        const posts_count = posts[0]?.posts_count || 0;
        const pages_count = Math.ceil(posts_count / POSTS_ON_PAGE);
        return {pages_count, contents: posts};
    }


    async deletePostByID(post_id: number, sender_id: number): Promise<void> {
        const post = await this.knex('post').select('*').where({id: post_id}).first();
        if (post.user_id !== sender_id) {
            throw new ForbiddenException();
        }
        if (!post) {
            throw new NotFoundException();
        }
        await this.knex('post').del().where({id: post_id});
    }

    async likePost(post_id: number, sender_id: number): Promise<void> {
        if (!sender_id) {
            throw new UnauthorizedException();
        }
        const liked = await this.knex('post_like')
            .where({
                user_id: sender_id,
                post_id,
            })
            .first();

        if (liked) {
            await this.knex('post_like').del().where({
                user_id: sender_id,
                post_id,
            });
            await this.notificationService.sendLikeNotification(sender_id, post_id, false);
        } else {
            await this.knex('post_like').insert({user_id: sender_id, post_id});
            await this.notificationService.sendLikeNotification(sender_id, post_id);
        }

    }

    async savePost(post_id: number, sender_id: number): Promise<void> {
        if (!sender_id) {
            throw new UnauthorizedException();
        }
        const saved = await this.knex('bookmark')
            .where({
                user_id: sender_id,
                post_id,
            })
            .first();

        if (saved) {
            await this.knex('bookmark').del().where({
                user_id: sender_id,
                post_id,
            });
        } else {
            await this.knex('bookmark').insert({user_id: sender_id, post_id});
        }
    }

    getPostsQuery(options: GetPostsQueries = {}, sender_id?: number): Knex.QueryBuilder<any, Post[]> {
        const {tags, sort, user_id, page, timestamp, search, id} = options;
        const query = this.knex('v_post AS post')
            .select("post.*", this.knex.raw('COUNT(*) OVER() AS posts_count'));

        if(id){
            query.where("post.id", id);
        }
        //if tags provided, ensure that intersection count of tags and post tags equals to tags count
        if (tags) {
            query.whereRaw(
                `(SELECT COUNT(*) FROM post_tag WHERE post_tag.tag = any(?) AND post_tag.post_id = post.id) = ?`,
                [options.tags.map(t => t.toLowerCase()), options?.tags.length]);
        }

        if (sort) {
            if(sort === "new") query.orderBy( 'post.created_at', 'DESC');
            else {
                query.orderBy("likes_count","DESC")
                     .orderBy( 'post.created_at', 'DESC');
            }

        } else {
            query.orderBy('post.created_at', 'DESC');
        }
        //check if user liked/saved post and set bool
        if (sender_id) {
            query.select(this.knex.raw(
                `EXISTS(SELECT * FROM post_like WHERE user_id = :id AND post_id = post.id) AS user_like,
                     EXISTS(SELECT * FROM bookmark WHERE user_id = :id AND post_id = post.id) AS user_saved`,
                {id: sender_id}));
        }
        if(user_id){
            query.where("post.user_id", user_id);
        }
        if (page && page > 0) {
            query.offset(POSTS_ON_PAGE * (page - 1)).limit(POSTS_ON_PAGE);
        }
        if(timestamp){
            query.where("post.created_at", "<", this.knex.raw(`to_timestamp(?)`, [timestamp]));
        }
        if(search){

            query.whereRaw(
                `(EXISTS
                        (SELECT el->'content' FROM jsonb_array_elements(post.content) AS el
                        WHERE el->>'type' = 'text'
                        AND el->>'content' LIKE :search)
                     OR post.title LIKE :search)`,
                {
                    search: `%${search.split(" ").join("%")}%`
                });
        }
        return query;
    }
}

