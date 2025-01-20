export function Footer() {
  return (
    <footer className="
      fixed bottom-0
      w-full
      border-t bg-gray-50 py-4 text-center text-sm text-gray-500
    ">
      © {new Date().getFullYear()} Singular Domain. All rights reserved.
    </footer>
  )
}