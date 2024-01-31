import {RoleKeyType, Roles} from "../model/roles.type";

export const rolesPermissions: RolesPermissionsType = {
    admin: {
        can: ["*"],
    },
    moderator: {
        can: [
            "user:ban:user",
            "user:delete:user",
            "user:update:user",
            "post:delete:user",
        ],
        extends: ["user"],
    },
    user: {

    }
}

export type RolesPermissionsType =  {
    [K in RoleKeyType]: {
        can?: string[],
        extends?: string[],
    }
}
