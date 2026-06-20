"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuthStore } from "@/lib/store/auth";
import { useCartStore, cartCount } from "@/lib/store/cart";
import { useBrandStore } from "@/lib/store/brand";

export function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const { token, logout } = useAuthStore();
  const { brand, token: brandToken } = useBrandStore();
  const items = useCartStore((s) => s.items);
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  const count = mounted ? cartCount(items) : 0;
  const isBrandDashboard = pathname?.startsWith("/brands/dashboard");

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
          {mounted && brandToken ? (
            <NavLink href="/brands/dashboard">Mi panel</NavLink>
          ) : (
            <NavLink href="/brands">Para marcas</NavLink>
          )}

          {/* Cart icon — oculto en dashboard de marcas */}
          {!isBrandDashboard && <CartIcon count={count} />}

          {/* Botón de sesión */}
          {mounted && (
            isBrandDashboard && brandToken ? (
              // En dashboard de marca: no mostrar nada, el botón Salir está en el dashboard
              null
            ) : token ? (
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
            )
          )}
        </div>
      </nav>
    </header>
  );
}

function CartIcon({ count }: { count: number }) {
  const [hov, setHov] = useState(false);
  return (
    <Link
      href="/cart"
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        position: "relative",
        display: "flex",
        alignItems: "center",
        color: hov ? "#111" : "#555",
        textDecoration: "none",
        transition: "color 0.15s",
      }}
    >
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" />
        <line x1="3" y1="6" x2="21" y2="6" />
        <path d="M16 10a4 4 0 01-8 0" />
      </svg>

      {count > 0 && (
        <span
          style={{
            position: "absolute",
            top: -6,
            right: -8,
            backgroundColor: "#111",
            color: "#fff",
            fontSize: 9,
            fontWeight: 700,
            minWidth: 16,
            height: 16,
            borderRadius: "50%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            lineHeight: 1,
            padding: "0 3px",
          }}
        >
          {count > 99 ? "99+" : count}
        </span>
      )}
    </Link>
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