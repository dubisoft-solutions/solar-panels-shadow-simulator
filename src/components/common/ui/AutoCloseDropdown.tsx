import React from 'react'

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
  return (
    <details className={className}>
      <summary>{trigger}</summary>
      <ul className={contentClassName}>
        {children}
      </ul>
    </details>
  )
}