"use client"

import Image from "next/image"
import Link from "next/link"
import { NavigationMenu, NavigationMenuList, NavigationMenuItem, NavigationMenuLink } from "@/components/ui/navigation-menu"
import { Button } from "@/components/ui/button"

export function Navbar() {
  // Example handler for the Connect Wallet button
  const handleConnectWallet = () => {
    alert("Connect Wallet clicked!")
    // Integrate your wallet logic here (e.g. wagmi, rainbowkit, etc.)
  }

  return (
    <header className="w-full border-b bg-white">
      {/* Top Nav: Logo + Navigation Items */}
      <div className="mx-auto flex max-w-screen-xl items-center justify-between p-4">
        {/* Left side: Logo + Brand name */}
        <div className="flex items-center space-x-2">
          <Image
            src="/icons/logo.svg"
            alt="Singular Domain Logo"
            width={40}
            height={40}
          />
          <span className="text-xl font-bold text-red-600">Singular Domain</span>
        </div>

        {/* Right side: Navigation menu + Connect Wallet */}
        <NavigationMenu>
          <NavigationMenuList className="flex items-center space-x-4">
            <NavigationMenuItem>
              <NavigationMenuLink asChild>
                <Link href="/" className="text-sm font-bold text-gray-700 hover:text-red-600">
                  Home
                </Link>
              </NavigationMenuLink>
            </NavigationMenuItem>
            <NavigationMenuItem>
              <NavigationMenuLink asChild>
                <Link href="/about" className="text-sm font-bold text-gray-700 hover:text-red-600">
                  About
                </Link>
              </NavigationMenuLink>
            </NavigationMenuItem>
            <NavigationMenuItem>
              <NavigationMenuLink asChild>
                <Link href="/contact" className="text-sm font-bold text-gray-700 hover:text-red-600">
                  Contact
                </Link>
              </NavigationMenuLink>
            </NavigationMenuItem>
            <NavigationMenuItem>
              <Button variant="default" onClick={handleConnectWallet}>
                Connect Wallet
              </Button>
            </NavigationMenuItem>
          </NavigationMenuList>
        </NavigationMenu>
      </div>
    </header>
  )
}
