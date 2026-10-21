/** Lecture / écriture immuable d'une valeur par chemin pointé (`hero.items.2.title`) */
export function getAt(source: unknown, path: string): unknown {
  return path.split('.').reduce<unknown>((value, key) => {
    if (value === null || value === undefined) return undefined
    return (value as Record<string, unknown>)[key]
  }, source)
}

export function setAt<T>(source: T, path: string, value: unknown): T {
  const [head, ...rest] = path.split('.')
  const container = (source ?? (/^\d+$/.test(head) ? [] : {})) as Record<string, unknown> | unknown[]
  const next = rest.length === 0 ? value : setAt((container as Record<string, unknown>)[head], rest.join('.'), value)
  if (Array.isArray(container)) {
    const copy = [...container]
    copy[Number(head)] = next
    return copy as T
  }
  return { ...(container as Record<string, unknown>), [head]: next } as T
}
