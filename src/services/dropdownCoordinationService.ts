/**
 * Dropdown Coordination Service
 *
 * Manages global dropdown state coordination following clean architecture principles.
 * This service provides a centralized way to handle dropdown interactions across the application.
 */

// Event types for dropdown coordination
export const DROPDOWN_EVENTS = {
  OPEN: 'dropdown:open',
  CLOSE_ALL: 'dropdown:close-all'
} as const

export interface DropdownOpenEvent extends CustomEvent {
  detail: {
    dropdownId: string
  }
}

/**
 * Service for coordinating dropdown behavior across the application
 */
export class DropdownCoordinationService {
  /**
   * Notifies all dropdowns that a specific dropdown has opened
   * This triggers other dropdowns to close
   */
  static notifyDropdownOpen(dropdownId: string): void {
    window.dispatchEvent(
      new CustomEvent(DROPDOWN_EVENTS.OPEN, {
        detail: { dropdownId }
      })
    )
  }

  /**
   * Closes all open dropdowns in the application
   * Useful for navigation events, escape key, or global state changes
   */
  static closeAllDropdowns(): void {
    window.dispatchEvent(new CustomEvent(DROPDOWN_EVENTS.CLOSE_ALL))
  }

  /**
   * Registers a dropdown for coordination
   * Returns cleanup function for the dropdown
   */
  static registerDropdown(
    element: HTMLDetailsElement,
    dropdownId: string
  ): () => void {
    const handleToggle = () => {
      if (element.open) {
        this.notifyDropdownOpen(dropdownId)
      }
    }

    const handleOtherDropdownOpen = (event: DropdownOpenEvent) => {
      const { dropdownId: otherDropdownId } = event.detail
      if (otherDropdownId !== dropdownId && element.open) {
        element.open = false
      }
    }

    const handleCloseAll = () => {
      if (element.open) {
        element.open = false
      }
    }

    const handleClickOutside = (event: MouseEvent) => {
      if (!element.contains(event.target as Node) && element.open) {
        element.open = false
      }
    }

    // Attach event listeners
    element.addEventListener('toggle', handleToggle)
    window.addEventListener(DROPDOWN_EVENTS.OPEN, handleOtherDropdownOpen as EventListener)
    window.addEventListener(DROPDOWN_EVENTS.CLOSE_ALL, handleCloseAll)
    document.addEventListener('click', handleClickOutside)

    // Return cleanup function
    return () => {
      element.removeEventListener('toggle', handleToggle)
      window.removeEventListener(DROPDOWN_EVENTS.OPEN, handleOtherDropdownOpen as EventListener)
      window.removeEventListener(DROPDOWN_EVENTS.CLOSE_ALL, handleCloseAll)
      document.removeEventListener('click', handleClickOutside)
    }
  }

  /**
   * Utility to handle keyboard events for accessibility
   * Call this from keyboard event handlers to close dropdowns on Escape
   */
  static handleKeyboardEvent(event: KeyboardEvent): void {
    if (event.key === 'Escape') {
      this.closeAllDropdowns()
    }
  }
}