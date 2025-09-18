'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useEffect } from 'react'
import { usePathname } from 'next/navigation'
import logo from '@/assets/images/logo.png'
import { AutoCloseDropdown } from './AutoCloseDropdown'
import { DropdownMenuItem } from './DropdownMenuItem'
import { useNavigationState } from '@/hooks/useNavigationState'
import { DropdownCoordinationService } from '@/services/dropdownCoordinationService'
import type { MenuItem } from '@/types/navigation'

// Define menu items once to avoid duplication
const menuItems: MenuItem[] = [
  { label: 'Home', href: '/' },
  {
    label: 'House',
    submenu: [
      { label: 'Specifications', href: '/specifications', disabled: true },
      { label: 'Energy System Shell', href: '/energy-system-shell'},
    ]
  },
  { label: 'Simulations', disabled: true },
  { label: 'About', href: '/about' , disabled: true}
]

export default function Navbar() {
  const navigation = useNavigationState()
  const pathname = usePathname()

  // Close all dropdowns when route changes
  useEffect(() => {
    DropdownCoordinationService.closeAllDropdowns()
  }, [pathname])

  // Handler for closing dropdowns when clicking main navigation items
  const handleMainNavClick = () => {
    DropdownCoordinationService.closeAllDropdowns()
  }

  // Add keyboard event handler for accessibility (Escape key)
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      DropdownCoordinationService.handleKeyboardEvent(event)
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [])

  return (
    <div className="navbar bg-base-100 shadow-md fixed top-0 left-0 right-0 z-50">
      <div className="flex-none">
        {/* Logo */}
        <Link href="/" onClick={handleMainNavClick} className="block p-2">
          <Image
            src={logo}
            alt="Logo"
            width={32}
            height={32}
            className="h-8 w-auto"
          />
        </Link>
      </div>

      <div className="flex-1 px-2 flex items-center">
        <h1 className="text-md lg:text-xl font-bold text-base-content">Shadow Simulator</h1>
      </div>

      {/* Desktop menu */}
      <div className="flex-none flex items-center">
        <ul className="menu menu-horizontal px-1 hidden lg:flex">
          {menuItems.map((item, index) => {
            const itemIsActive = navigation.isActive(item.href) || navigation.isAnySubItemActive(item.submenu)
            return (
              <li key={index}>
                {item.submenu ? (
                  <AutoCloseDropdown
                    trigger={item.label}
                    className={itemIsActive ? 'text-primary font-semibold' : ''}
                  >
                    {item.submenu.map((subItem, subIndex) => (
                      <li key={subIndex}>
                        <DropdownMenuItem
                          label={subItem.label}
                          href={subItem.href}
                          disabled={subItem.disabled}
                          isActive={navigation.isActive(subItem.href)}
                        />
                      </li>
                    ))}
                  </AutoCloseDropdown>
                ) : item.disabled ? (
                  <span className="text-base-content/50 cursor-not-allowed">{item.label}</span>
                ) : (
                  <Link
                    href={item.href!}
                    onClick={handleMainNavClick}
                    className={itemIsActive ? 'text-primary font-semibold' : ''}
                  >
                    {item.label}
                  </Link>
                )}
              </li>
            )
          })}
        </ul>

        {/* Mobile dropdown */}
        <div className="dropdown dropdown-end">
          <div tabIndex={0} role="button" className="btn btn-ghost lg:hidden">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h8m-8 6h16" />
            </svg>
          </div>
          <ul tabIndex={0} className="menu menu-sm dropdown-content bg-base-100 rounded-box z-[1] mt-3 w-52 p-2 shadow">
            {menuItems.map((item, index) => {
              const itemIsActive = navigation.isActive(item.href) || navigation.isAnySubItemActive(item.submenu)
              return (
                <li key={index}>
                  {item.submenu ? (
                    <AutoCloseDropdown
                      trigger={item.label}
                      contentClassName="p-2"
                      className={itemIsActive ? 'text-primary font-semibold' : ''}
                    >
                      {item.submenu.map((subItem, subIndex) => (
                        <li key={subIndex}>
                          <DropdownMenuItem
                            label={subItem.label}
                            href={subItem.href}
                            disabled={subItem.disabled}
                            isActive={navigation.isActive(subItem.href)}
                          />
                        </li>
                      ))}
                    </AutoCloseDropdown>
                  ) : item.disabled ? (
                    <span className="text-base-content/50 cursor-not-allowed">{item.label}</span>
                  ) : (
                    <Link
                      href={item.href!}
                      onClick={handleMainNavClick}
                      className={itemIsActive ? 'text-primary font-semibold' : ''}
                    >
                      {item.label}
                    </Link>
                  )}
                </li>
              )
            })}
          </ul>
        </div>
      </div>
    </div>
  )
}