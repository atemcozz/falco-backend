interface Comment {
    id: number,
    body: string,
    created_at: Date,
    post_id: number,
    answer_to: number,
    user_id: number,
    user_nickname: string,
    user_avatar_url: string
}