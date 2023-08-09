export function mutateObject<T, K>(
  object: T,
  actions: { [key in keyof T]?: (key: keyof T, value: T[keyof T]) => any },
): K {
  let result;
  if (!object) return null;
  for (const key of Object.keys(object)) {
    if (key in actions) {
      const mutated = actions[key](key, object[key]);

      if (!mutated) continue;
      if (typeof mutated === 'object' && !Array.isArray(mutated)) {
        result = { ...result, ...mutated };
      } else {
        result = { ...result, [key]: mutated };
      }
    } else {
      result = { ...result, [key]: object[key] };
    }
  }

  return result;
}

export async function mutateObjectAsync<T, K>(
  object: T,
  actions: { [key in keyof T]?: (key: keyof T, value: T[keyof T]) => any },
): Promise<K> {
  let result;
  if (!object) return null;
  for (const key of Object.keys(object)) {
    if (key in actions) {
      const mutated = await actions[key](key, object[key]);

      if (!mutated) continue;
      if (typeof mutated === 'object' && !Array.isArray(mutated)) {
        result = { ...result, ...mutated };
      } else {
        result = { ...result, [key]: mutated };
      }
    } else {
      result = { ...result, [key]: object[key] };
    }
  }

  return result;
}
