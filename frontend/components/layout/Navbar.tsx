import Link from "next/link";

export function Navbar() {
  return (
    <header className="border-b">
      <nav className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/" className="text-xl font-bold tracking-tight">
          Twiniky
        </Link>
        <div className="flex items-center gap-6 text-sm font-medium">
          <Link href="/marketplace" className="hover:text-gray-500 transition">
            Marketplace
          </Link>
          <Link href="/tryon" className="hover:text-gray-500 transition">
            Probador 3D
          </Link>
          <Link
            href="/login"
            className="rounded-lg border px-4 py-1.5 hover:bg-gray-50 transition"
          >
            Entrar
          </Link>
        </div>
      </nav>
    </header>
  );
}
