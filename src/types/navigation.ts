export interface MenuItem {
  label: string
  href?: string
  disabled?: boolean
  submenu?: SubMenuItem[]
}

export interface SubMenuItem {
  label: string
  href?: string
  disabled?: boolean
}

export interface NavigationState {
  isActive: (href?: string) => boolean
  isAnySubItemActive: (submenu?: SubMenuItem[]) => boolean
  isSubPath: (href: string, exact?: boolean) => boolean
  normalizedPathname: string
}