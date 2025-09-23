'use client'

import { useSearchParams } from 'next/navigation'
import { LayoutId } from '@/domain/entities/LayoutConfiguration'
import { DEFAULT_LAYOUT_ID } from '@/config/layoutConfigurations'

/**
 * Custom React hook to get the current layout from URL search parameters
 * Uses Next.js useSearchParams for reactive updates when URL changes
 */
export function useLayoutFromURL(): LayoutId {
  const searchParams = useSearchParams()
  const layoutParam = searchParams.get('layout')

  // Validate the layout parameter
  const validLayouts: LayoutId[] = ['current', 'longer-connectors', 'sw-reposition', 'sw-reposition-1500', 'sw-portrait']

  if (layoutParam && validLayouts.includes(layoutParam as LayoutId)) {
    return layoutParam as LayoutId
  }

  return DEFAULT_LAYOUT_ID
}