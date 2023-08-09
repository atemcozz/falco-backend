import {Knex} from "knex";
import * as userQueryHelpers from "../../user/helpers/user-query-helpers"
export function postBaseQuery(knex: Knex){
    return knex('post')
        .select(
            "post.*",
            this.knex.raw("ARRAY_AGG(post_tag.tag) AS tags"),
            ...userQueryHelpers.includeColumnsAliased)
        .countDistinct("post_like AS likes_count")
        .countDistinct("comment AS comments_count")
        .join("person", "person.id", "post.user_id")
        .leftJoin("post_like", "post_like.post_id", "post.id")
        .leftJoin("post_tag", "post_tag.post_id", "post.id")
        .leftJoin("comment", "comment.post_id", "post.id")
        .leftJoin("bookmark", "bookmark.post_id", "post.id")
        .groupBy("post.id", "person.id")
}
