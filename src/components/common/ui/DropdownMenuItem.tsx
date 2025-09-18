import Link from 'next/link'

interface DropdownMenuItemProps {
  label: string
  href?: string
  disabled?: boolean
  onClick?: () => void
}

export function DropdownMenuItem({ label, href, disabled, onClick }: DropdownMenuItemProps) {
  const handleClick = (event: React.MouseEvent) => {
    // Find the parent <details> element and close it
    const detailsElement = (event.target as HTMLElement).closest('details')
    if (detailsElement) {
      detailsElement.open = false
    }

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
      <Link href={href} onClick={handleClick}>
        {label}
      </Link>
    )
  }

  return (
    <button onClick={handleClick} className="w-full text-left">
      {label}
    </button>
  )
}