"use client";

import { useState } from "react";
import Link from "next/link";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import Image from "next/image";

export function Header() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <header className="w-full py-3 border-b border-gray-300 bg-white text-center">
      <div className="max-w-7xl mx-auto flex justify-between items-center px-6">
        {/* Left side: brand or logo */}
        <Link href="/">
          <div className="flex items-center space-x-2">
            {/* Example logo placeholder */}
            <div className="h-8 w-8 rounded-full bg-gray-200">
              <Image
                src="/icons/logo.svg"
                alt="Opti.domains logo"
                width="40"
                height="40"
              />
            </div>
            <h1 className="md:text-2xl font-bold text-gray-900 tracking-tight text-base">
              Opti.Domains <span className="text-blue-600">ENS L2</span>
            </h1>
          </div>
        </Link>

        {/* Right side: nav & hamburger toggle */}
        <div className="flex items-center space-x-2 md:space-x-6">
          <button
            className="md:hidden"
            onClick={() => setIsOpen((prev) => !prev)}
            aria-label="Toggle Menu"
          >
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
            {/* RainbowKit Connect Button */}
            <ConnectButton
              showBalance={false}
              accountStatus="address"
              chainStatus="icon"
              label="Connect"
            />
          </nav>
        </div>
      </div>

      {/* Mobile Nav (shown only when isOpen && on small screens) */}
      {isOpen && (
        <nav className="flex flex-col space-y-2 border-t p-4 md:hidden">
          {/* RainbowKit Connect Button */}
          <ConnectButton
            showBalance={false}
            accountStatus="address"
            chainStatus="icon"
            label="Connect"
          />
        </nav>
      )}
    </header>
  );
}
