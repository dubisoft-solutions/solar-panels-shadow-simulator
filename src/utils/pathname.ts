/**
 * Normalizes pathname by removing trailing slashes except for root
 */
export function normalizePath(path: string): string {
  return path === '/' ? path : path.replace(/\/$/, '')
}

/**
 * Checks if two paths match exactly after normalization
 */
export function isExactPathMatch(pathname: string, href: string): boolean {
  return normalizePath(pathname) === normalizePath(href)
}

/**
 * Checks if pathname is a sub-path of href
 */
export function isSubPathOf(pathname: string, href: string): boolean {
  const normalizedPathname = normalizePath(pathname)
  const normalizedHref = normalizePath(href)
  return normalizedPathname.startsWith(normalizedHref + '/')
}