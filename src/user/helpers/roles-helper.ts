import {RoleKeyType, Roles} from "../model/roles.type";
import { rolesPermissions} from "../const/roles-permissions";

export function getRolePermissions(roleName: RoleKeyType): string[] {
    const role = rolesPermissions[roleName];
    if(!role) return [];
    let permissions = role.can ?
        (Array.isArray(role.can) ? [...role.can]: [role.can]) : [];

    if(Array.isArray(role.extends)){
        role.extends?.forEach((parent: RoleKeyType) => {
            permissions = permissions.concat(getRolePermissions(parent))
        });
    }
    else permissions = permissions.concat(getRolePermissions(role.extends))
    return permissions;
}

export function roleHasPermission(roleName: RoleKeyType, permission: string){
    const [domain, action, target] = permission.split(":");
    const permissions = getRolePermissions(roleName);

    if(permissions.includes(`${domain}:${action}`) || permissions.includes("*")){
        return true;
    }

    return permissions.includes(`${domain}:${action}:${target}`);
}