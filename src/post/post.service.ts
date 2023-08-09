import {Injectable} from '@nestjs/common';
import {
    BadRequestException,
    ForbiddenException,
    NotFoundException,
    UnauthorizedException,
} from '@nestjs/common/exceptions';
import {knex, Knex} from 'knex';
import {InjectConnection} from 'nestjs-knex';
import {CreatePostDto} from './dto/create-post.dto';


import * as postQueryHelpers from "./helpers/post-query-helpers"
import QueryBuilder = knex.QueryBuilder;
import {POSTS_ON_PAGE} from "./const/post-const";

@Injectable()
export class PostService {
    constructor(@InjectConnection() private readonly knex: Knex) {
    }

    async getPosts(options: { sort?: string; tags?: string[]; user_id?: number, page?: number, timestamp?: string } = {}) {
        const {tags, sort, user_id, page, timestamp} = options;
        const posts = await this.getPostsQuery({tags, sort, user_id, page, timestamp});
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
            console.log(tags);
            await this.knex('post_tag').insert(tagsRows);
        }
        const new_post: Post = await this.getPostsQuery().where({"post.id": post_id}).first();
        return new_post;
    }

    async getSavedPosts(user_id: number): Promise<PostSet> {
        const posts: Post[] = await this.getPostsQuery({user_id})
            .leftJoin("bookmark", "bookmark.post_id", "post.id")
            .where("bookmark.user_id", user_id);
        const posts_count = posts[0]?.posts_count || 0;
        const pages_count = Math.ceil(posts_count / POSTS_ON_PAGE);
        const post_set: PostSet = {pages_count, contents: posts};
        return post_set;
    }

    async getPostByID(post_id: number, user_id?: number): Promise<Post> {
        const post: Post = await this.getPostsQuery({user_id}).where("post.id", post_id).first();
        if (!post) {
            throw new NotFoundException();
        }

        return post;
    }

    async getPostsByUser(user_id: number, sender_id?: number): Promise<PostSet> {
        const posts: Post[] = await this.getPostsQuery({user_id}).where("post.user_id", user_id);
        const posts_count = posts[0]?.posts_count || 0;
        const pages_count = Math.ceil(posts_count / POSTS_ON_PAGE);
        const post_set: PostSet = {pages_count, contents: posts};
        return post_set;

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
        } else {
            await this.knex('post_like').insert({user_id: sender_id, post_id});
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

    getPostsQuery(options: PostQueryOptions = {}): Knex.QueryBuilder<any, Post[]> {
        const {tags, sort, user_id, page, timestamp} = options;
        const query = this.knex('v_post AS post')
            .select("post.*", this.knex.raw('COUNT(*) OVER() AS posts_count'));
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
        if (user_id) {
            query.select(this.knex.raw(
                `EXISTS(SELECT * FROM post_like WHERE user_id = :id AND post_id = post.id) AS user_like,
                     EXISTS(SELECT * FROM bookmark WHERE user_id = :id AND post_id = post.id) AS user_saved`,
                {id: user_id}));
        }
        if (page && page > 0) {
            query.offset(POSTS_ON_PAGE * (page - 1)).limit(POSTS_ON_PAGE);
        }
        if(timestamp){
            query.where("post.created_at", "<", this.knex.raw(`to_timestamp(?)`, [timestamp]));
        }
        return query;
    }
}

type PostQueryOptions = {
    tags?: string[],
    sort?: string,
    user_id?: number,
    page?: number,
    timestamp?: string,
};