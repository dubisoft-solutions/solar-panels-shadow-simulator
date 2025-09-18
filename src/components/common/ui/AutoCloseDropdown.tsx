import React, { useRef, useEffect } from 'react'
import { DropdownCoordinationService } from '@/services/dropdownCoordinationService'

interface AutoCloseDropdownProps {
  trigger: React.ReactNode
  children: React.ReactNode
  className?: string
  contentClassName?: string
}

export function AutoCloseDropdown({
  trigger,
  children,
  className = '',
  contentClassName = 'p-2 bg-base-100 rounded-t-none w-48'
}: AutoCloseDropdownProps) {
  const detailsRef = useRef<HTMLDetailsElement>(null)
  const dropdownId = useRef(Math.random().toString(36))

  useEffect(() => {
    const detailsElement = detailsRef.current
    if (!detailsElement) return

    // Register this dropdown with the coordination service
    const cleanup = DropdownCoordinationService.registerDropdown(
      detailsElement,
      dropdownId.current
    )

    // Return cleanup function
    return cleanup
  }, [])

  return (
    <details ref={detailsRef}>
      <summary className={className}>{trigger}</summary>
      <ul className={contentClassName}>
        {children}
      </ul>
    </details>
  )
}