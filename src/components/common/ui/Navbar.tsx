'use client'

import Image from 'next/image'
import Link from 'next/link'
import logo from '@/assets/images/logo.png'

// Define menu items once to avoid duplication
const menuItems = [
  {
    label: 'House',
    submenu: [
      { label: 'Shadow Simulator', href: '/'},
      { label: 'Specifications', href: '/specifications', disabled: true },
      { label: 'Energy System Shell', href: '/energy-system-shell'},
    ]
  },
  { label: 'Simulations', disabled: true },
  { label: 'About', href: '/about' , disabled: true}
]

export default function Navbar() {
  return (
    <div className="navbar bg-base-100 shadow-md fixed top-0 left-0 right-0 z-50">
      <div className="flex-none">
        {/* Logo */}
        <Link href="/" className="btn btn-ghost">
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
          {menuItems.map((item, index) => (
            <li key={index}>
              {item.submenu ? (
                <details>
                  <summary>{item.label}</summary>
                  <ul className="p-2 bg-base-100 rounded-t-none w-48">
                    {item.submenu.map((subItem, subIndex) => (
                      <li key={subIndex}>
                        {subItem.disabled ? (
                          <span className="text-base-content/50 cursor-not-allowed">{subItem.label}</span>
                        ) : (
                          <Link href={subItem.href}>{subItem.label}</Link>
                        )}
                      </li>
                    ))}
                  </ul>
                </details>
              ) : item.disabled ? (
                <span className="text-base-content/50 cursor-not-allowed">{item.label}</span>
              ) : (
                <Link href={item.href!}>{item.label}</Link>
              )}
            </li>
          ))}
        </ul>

        {/* Mobile dropdown */}
        <div className="dropdown dropdown-end">
          <div tabIndex={0} role="button" className="btn btn-ghost lg:hidden">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h8m-8 6h16" />
            </svg>
          </div>
          <ul tabIndex={0} className="menu menu-sm dropdown-content bg-base-100 rounded-box z-[1] mt-3 w-52 p-2 shadow">
            {menuItems.map((item, index) => (
              <li key={index}>
                {item.submenu ? (
                  <details>
                    <summary>{item.label}</summary>
                    <ul className="p-2">
                      {item.submenu.map((subItem, subIndex) => (
                        <li key={subIndex}>
                          {subItem.disabled ? (
                            <span className="text-base-content/50 cursor-not-allowed">{subItem.label}</span>
                          ) : (
                            <Link href={subItem.href}>{subItem.label}</Link>
                          )}
                        </li>
                      ))}
                    </ul>
                  </details>
                ) : item.disabled ? (
                  <span className="text-base-content/50 cursor-not-allowed">{item.label}</span>
                ) : (
                  <Link href={item.href!}>{item.label}</Link>
                )}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
}