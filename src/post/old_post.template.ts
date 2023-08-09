import { Injectable } from '@nestjs/common/decorators/core/injectable.decorator';
import { Knex } from 'knex';
import { InjectConnection } from 'nestjs-knex';

@Injectable()
export class PostKnexTemplate {
  constructor(@InjectConnection() private readonly knex: Knex) {}

  // query() {
  //   return this.helpers('post as p')
  //     .join('person as u', 'p.user_id', 'u.id')
  //     .leftJoin('comment as c', 'p.id', 'c.post_id')
  //     .leftJoin('post_like as pl', 'p.id', 'pl.post_id')
  //     .leftJoin('post_tag as t', 'p.id', 't.post_id')
  //     .select(
  //       'p.id',
  //       'p.title',
  //       'p.created_at',
  //       'p.content',
  //       'p.preview',
  //       this.helpers.raw(
  //         "jsonb_build_object('id', u.id,'nickname', u.nickname ,'name', u.name, 'surname', u.surname, 'avatar_url', u.avatar_url) as user",
  //       ),
  //       this.helpers.raw('array_agg(distinct t.tag) AS tags'),
  //     )
  //     .countDistinct('pl as likes_count')
  //     .countDistinct('c as comments_count')
  //     .groupBy('p.id', 'u.id');
  // }
  getPosts() {
    return this.knex('post')
        .select(
            "post.*",
            "person.id AS user_id",
            "person.nickname AS user_nickname",
            "person.avatar_url AS user_avatar_url",
                  this.knex.raw("ARRAY_AGG(post_tag.tag) AS tags"))
        .countDistinct("post_like AS likes_count")
        .countDistinct("comment AS comments_count")
        .join("person", "person.id", "post.user_id")
        .leftJoin("post_like", "post_like.post_id", "post.id")
        .leftJoin("post_tag", "post_tag.post_id", "post.id")
        .leftJoin("comment", "comment.post_id", "post.id")
        .leftJoin("bookmark", "bookmark.post_id", "post.id")
        .groupBy("post.id", "person.id")


  }
  selectUserFlags(builder, user_id){
    builder.select(this.knex.raw(
        `EXISTS(SELECT * FROM post_like WHERE user_id = ? AND post_id = post.id) AS user_like`, [user_id]));
    builder.select(this.knex.raw(
        `EXISTS(SELECT * FROM bookmark WHERE user_id = ? AND post_id = post.id) AS user_saved`, [user_id]));
  }

}
