interface Post{
    id: number,
    title: string,
    preview: string,
    created_at: Date,
    content: {type: string, content: any}[] | string,
    user_id: number,
    user_nickname: string,
    user_avatar_url?: string,
    user_like?: boolean,
    user_saved?: boolean,
    likes_count: number,
    comments_count: number,
    tags?: string[]
    posts_count?: number,
}