"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/store/auth";

export function Navbar() {
  const router = useRouter();
  const { token, logout } = useAuthStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  function handleLogout() {
    logout();
    router.push("/");
  }

  return (
    <header
      style={{
        borderBottom: "1px solid #ebebeb",
        backgroundColor: "#fff",
        position: "sticky",
        top: 0,
        zIndex: 30,
      }}
    >
      <nav
        style={{
          maxWidth: 1440,
          margin: "0 auto",
          padding: "0 32px",
          height: 56,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <Link
          href="/"
          style={{
            fontSize: 16,
            fontWeight: 700,
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            color: "#111",
            textDecoration: "none",
          }}
        >
          Twiniky
        </Link>

        <div style={{ display: "flex", alignItems: "center", gap: 28 }}>
          <NavLink href="/marketplace">Marketplace</NavLink>
          <NavLink href="/tryon">Probador 3D</NavLink>

          {mounted && token ? (
            <button
              onClick={handleLogout}
              style={{
                fontSize: 11,
                fontWeight: 500,
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                border: "1px solid #ddd",
                backgroundColor: "transparent",
                color: "#333",
                padding: "6px 14px",
                cursor: "pointer",
              }}
            >
              Salir
            </button>
          ) : (
            <Link
              href="/login"
              style={{
                fontSize: 11,
                fontWeight: 500,
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                border: "1px solid #ddd",
                color: "#333",
                padding: "6px 14px",
                textDecoration: "none",
              }}
            >
              Entrar
            </Link>
          )}
        </div>
      </nav>
    </header>
  );
}

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  const [hov, setHov] = useState(false);
  return (
    <Link
      href={href}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        fontSize: 11,
        fontWeight: 500,
        letterSpacing: "0.1em",
        textTransform: "uppercase",
        color: hov ? "#111" : "#888",
        textDecoration: "none",
        transition: "color 0.15s",
      }}
    >
      {children}
    </Link>
  );
}
