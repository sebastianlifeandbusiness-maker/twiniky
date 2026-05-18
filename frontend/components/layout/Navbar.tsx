"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/store/auth";

export function Navbar() {
  const router = useRouter();
  const { token, logout } = useAuthStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleLogout = () => {
    logout();
    router.push("/");
  };

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
          {mounted && token ? (
            <button
              onClick={handleLogout}
              className="rounded-lg border px-4 py-1.5 hover:bg-gray-50 transition"
            >
              Cerrar sesión
            </button>
          ) : (
            <Link
              href="/login"
              className="rounded-lg border px-4 py-1.5 hover:bg-gray-50 transition"
            >
              Entrar
            </Link>
          )}
        </div>
      </nav>
    </header>
  );
}
