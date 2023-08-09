export const publicColumns = ['person.id', 'person.name', 'person.surname',
    'person.nickname', 'person.email' ,'person.sex',
    'person.country', 'person.about', 'person.avatar_url'];
export const includeColumnsAliased = [
    'person.id AS user_id',
    'person.name AS user_name',
    'person.surname AS user_surname',
    'person.nickname AS user_nickname',
    'person.avatar_url AS user_avatar_url'];