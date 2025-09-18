import Link from 'next/link'
import { DropdownCoordinationService } from '@/services/dropdownCoordinationService'

interface DropdownMenuItemProps {
  label: string
  href?: string
  disabled?: boolean
  onClick?: () => void
  isActive?: boolean
}

export function DropdownMenuItem({ label, href, disabled, onClick, isActive }: DropdownMenuItemProps) {
  const handleClick = (event: React.MouseEvent) => {
    // Find the parent <details> element and close it
    const detailsElement = (event.target as HTMLElement).closest('details')
    if (detailsElement) {
      detailsElement.open = false
    }

    // Also trigger global close event for any other open dropdowns
    DropdownCoordinationService.closeAllDropdowns()

    // Call any additional onClick handler
    onClick?.()
  }

  if (disabled) {
    return (
      <span className="text-base-content/50 cursor-not-allowed">
        {label}
      </span>
    )
  }

  if (href) {
    return (
      <Link
        href={href}
        onClick={handleClick}
        className={isActive ? 'text-primary font-semibold' : ''}
      >
        {label}
      </Link>
    )
  }

  return (
    <button
      onClick={handleClick}
      className={`w-full text-left ${isActive ? 'text-primary font-semibold' : ''}`}
    >
      {label}
    </button>
  )
}