export enum Roles {
    User,
    Moderator,
    Admin
}
export type RoleKeyType = Lowercase<keyof typeof Roles>