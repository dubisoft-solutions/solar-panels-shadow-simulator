import { usePathname } from 'next/navigation'
import { useMemo, useCallback } from 'react'
import { normalizePath, isExactPathMatch } from '@/utils/pathname'
import type { SubMenuItem, NavigationState } from '@/types/navigation'

export function useNavigationState(): NavigationState {
  const pathname = usePathname()

  const normalizedPathname = useMemo(() =>
    normalizePath(pathname), [pathname]
  )

  const isActive = useCallback((href?: string): boolean => {
    if (!href) return false
    return isExactPathMatch(pathname, href)
  }, [pathname])

  const isAnySubItemActive = useCallback((submenu?: SubMenuItem[]): boolean => {
    if (!submenu) return false
    return submenu.some(item =>
      item.href && isExactPathMatch(pathname, item.href)
    )
  }, [pathname])

  const isSubPath = useCallback((href: string, exact = true): boolean => {
    return exact
      ? isExactPathMatch(pathname, href)
      : isExactPathMatch(pathname, href) // For now, keeping it simple
  }, [pathname])

  return useMemo(() => ({
    isActive,
    isAnySubItemActive,
    isSubPath,
    normalizedPathname
  }), [isActive, isAnySubItemActive, isSubPath, normalizedPathname])
}