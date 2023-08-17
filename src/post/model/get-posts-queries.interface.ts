export interface GetPostsQueries {
    id?: number,
    search?: string,
    tags?: string[],
    sort?: string,
    user_id?: number,
    page?: number,
    timestamp?: string,
};