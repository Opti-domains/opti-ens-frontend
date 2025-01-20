"use client"

import { useState } from "react"
import Link from "next/link"
import { ConnectButton } from "@rainbow-me/rainbowkit"
import Image from "next/image";

export function Header() {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <header className="border-b bg-white">
      <div className="mx-auto flex max-w-screen-xl items-center justify-between px-4 py-3">
        {/* Left side: brand or logo */}
        <div className="flex items-center space-x-2">
          {/* Example logo placeholder */}
          <div className="h-8 w-8 rounded-full bg-gray-200">
            <Image src="/icons/logo.svg" alt="Singular domains logo" width="40" height="40" />
          </div>
          <span className="text-lg font-semibold text-red-600">Singular Domain</span>
        </div>

        {/* Right side: nav & hamburger toggle */}
        <div className="flex items-center space-x-2 md:space-x-6">
          {/* Hamburger button (shown on mobile) */}
          <button
            className="md:hidden"
            onClick={() => setIsOpen((prev) => !prev)}
            aria-label="Toggle Menu"
          >
            {/* Simple Hamburger Icon (Tailwind Hero Icons style) */}
            <svg
              className="h-6 w-6 text-gray-800"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              viewBox="0 0 24 24"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>

          {/* Desktop Nav (hidden on small screens) */}
          <nav className="hidden items-center space-x-6 md:flex">
            <Link
              href="/"
              className="text-sm font-bold text-gray-600 hover:text-red-600"
            >
              Home
            </Link>
            <Link
              href="/about"
              className="text-sm font-bold text-gray-600 hover:text-red-600"
            >
              About
            </Link>
            <Link
              href="/contact"
              className="text-sm font-bold text-gray-600 hover:text-red-600"
            >
              Contact
            </Link>

            {/* RainbowKit Connect Button */}
            <ConnectButton showBalance={false} label="Connect" />
          </nav>
        </div>
      </div>

      {/* Mobile Nav (shown only when isOpen && on small screens) */}
      {isOpen && (
        <nav className="flex flex-col space-y-2 border-t p-4 md:hidden">
          <Link
            href="/"
            className="text-sm font-medium text-gray-600"
            onClick={() => setIsOpen(false)}
          >
            Home
          </Link>
          <Link
            href="/about"
            className="text-sm font-medium text-gray-600"
            onClick={() => setIsOpen(false)}
          >
            About
          </Link>
          <Link
            href="/contact"
            className="text-sm font-medium text-gray-600"
            onClick={() => setIsOpen(false)}
          >
            Contact
          </Link>

          {/* RainbowKit Connect Button */}
          <ConnectButton showBalance={false} label="Connect" />
        </nav>
      )}
    </header>
  )
}
