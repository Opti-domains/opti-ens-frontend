export function Footer() {
  return (
    <footer className="
      fixed bottom-0
      w-full py-4 border-t border-gray-300 bg-gray-50 text-center text-gray-600 text-sm
    ">
      {/*© {new Date().getFullYear()} Singular Domain. All rights reserved.*/}
      <p className="tracking-wide">
        © 2025 <span className="font-semibold text-blue-600">Singular Domain</span>.
        All rights reserved.
      </p>
    </footer>
  )
}