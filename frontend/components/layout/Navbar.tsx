"use client";

import Link from "next/link";
import { useEffect, useState, Suspense } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useAuthStore } from "@/lib/store/auth";
import { useCartStore, cartCount } from "@/lib/store/cart";
import { useBrandStore } from "@/lib/store/brand";
import { useFavoritesStore } from "@/lib/store/favorites";
import { useAlertsStore } from "@/lib/store/alerts";
import { favoritesApi, stockAlertsApi } from "@/lib/api";

const NAV_CATEGORIES = [
  { label: "Todos",       href: "/marketplace" },
  { label: "Tops",        href: "/marketplace?category=Tops" },
  { label: "Pantalones",  href: "/marketplace?category=Pantalones" },
  { label: "Vestidos",    href: "/marketplace?category=Vestidos" },
  { label: "Chaquetas",   href: "/marketplace?category=Chaquetas" },
  { label: "Zapatos",     href: "/marketplace?category=Zapatos" },
  { label: "Accesorios",  href: "/marketplace?category=Accesorios" },
];

export function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const { token, logout } = useAuthStore();
  const { brand, token: brandToken, clearBrand } = useBrandStore();
  const items = useCartStore((s) => s.items);
  const setAllFavorites = useFavoritesStore((s) => s.setAll);
  const { count: alertCount, setCount: setAlertCount } = useAlertsStore();
  const [mounted, setMounted] = useState(false);
  const [search, setSearch] = useState("");

  useEffect(() => { setMounted(true); }, []);

  // Cargar favoritos y alertas cuando hay sesión de comprador
  useEffect(() => {
    if (!token) return;
    favoritesApi.list()
      .then(({ data }) => setAllFavorites(data.map((p) => p.id)))
      .catch(() => {});
    stockAlertsApi.list()
      .then(({ data }) => setAlertCount(data.length))
      .catch(() => {});
  }, [token, setAllFavorites, setAlertCount]);

  const count = mounted ? cartCount(items) : 0;

  function handleBuyerLogout() {
    logout();
    setAllFavorites([]);
    router.push("/");
  }

  function handleBrandLogout() {
    clearBrand();
    router.push("/");
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!search.trim()) return;
    const params = new URLSearchParams({ q: search.trim() });
    if (brandToken && brand) params.set("brand_id", brand.id);
    router.push(`/marketplace?${params.toString()}`);
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
          gap: 24,
        }}
      >
        {/* Logo */}
        <Link
          href={mounted && brandToken ? "/marketplace" : "/"}
          style={{
            fontSize: 16,
            fontWeight: 700,
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            color: "#111",
            textDecoration: "none",
            flexShrink: 0,
          }}
        >
          Twiniky
        </Link>

        {/* Search — centro */}
        {mounted && (
          <form
            onSubmit={handleSearch}
            style={{
              flex: 1,
              maxWidth: 400,
              margin: "0 auto",
              position: "relative",
            }}
          >
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar prendas, marcas…"
              style={{
                width: "100%",
                padding: "7px 36px 7px 14px",
                fontSize: 12,
                color: "#333",
                border: "1px solid #e8e8e8",
                backgroundColor: "#fafafa",
                outline: "none",
                boxSizing: "border-box",
                fontFamily: "inherit",
              }}
            />
            <button
              type="submit"
              style={{
                position: "absolute",
                right: 10,
                top: "50%",
                transform: "translateY(-50%)",
                background: "none",
                border: "none",
                padding: 0,
                cursor: "pointer",
                color: "#aaa",
                display: "flex",
                alignItems: "center",
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
            </button>
          </form>
        )}

        {/* Derecha */}
        <div style={{ display: "flex", alignItems: "center", gap: 20, marginLeft: "auto", flexShrink: 0 }}>
          {!mounted ? null : brandToken ? (
            /* MARCA */
            <>
              <Link
                href="/brands/dashboard"
                style={{
                  fontSize: 11, fontWeight: 500, letterSpacing: "0.1em",
                  textTransform: "uppercase", border: "1px solid #111",
                  color: "#111", padding: "6px 14px", textDecoration: "none",
                }}
              >
                Panel de marca
              </Link>
              <button
                onClick={handleBrandLogout}
                style={{
                  fontSize: 11, fontWeight: 500, letterSpacing: "0.1em",
                  textTransform: "uppercase", border: "1px solid #ddd",
                  backgroundColor: "transparent", color: "#333",
                  padding: "6px 14px", cursor: "pointer",
                }}
              >
                Cerrar sesión
              </button>
            </>
          ) : token ? (
            /* COMPRADOR */
            <>
              <NavLink href="/marketplace">Marketplace</NavLink>
              <IconButton href="/favorites" label="Favoritos"><HeartIcon /></IconButton>
              <IconButton href="/tryon" label="Probador 3D"><MannequinIcon /></IconButton>
              <BellIcon count={alertCount} />
              <CartIcon count={count} />
              <button
                onClick={handleBuyerLogout}
                style={{
                  fontSize: 11, fontWeight: 500, letterSpacing: "0.1em",
                  textTransform: "uppercase", border: "1px solid #ddd",
                  backgroundColor: "transparent", color: "#333",
                  padding: "6px 14px", cursor: "pointer",
                }}
              >
                Cerrar sesión
              </button>
            </>
          ) : (
            /* INVITADO */
            <>
              <NavLink href="/marketplace">Marketplace</NavLink>
              <NavLink href="/brands">Para marcas</NavLink>
              <CartIcon count={count} />
              <Link
                href="/login"
                style={{
                  fontSize: 11, fontWeight: 500, letterSpacing: "0.1em",
                  textTransform: "uppercase", border: "1px solid #111",
                  color: "#111", padding: "6px 14px", textDecoration: "none",
                }}
              >
                Iniciar sesión
              </Link>
            </>
          )}
        </div>
      </nav>

      {/* ── Segunda fila: categorías ── */}
      {mounted && (
        <Suspense fallback={<div style={{ borderTop: "1px solid #f0f0f0", height: 38 }} />}>
          <NavCategoryBar brandToken={brandToken} brand={brand} />
        </Suspense>
      )}
    </header>
  );
}

function NavCategoryBar({ brandToken, brand }: { brandToken: string | null; brand: { id: string } | null }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const urlCategory = searchParams.get("category");

  return (
    <div style={{ borderTop: "1px solid #f0f0f0" }}>
      <div
        style={{
          maxWidth: 1440,
          margin: "0 auto",
          padding: "0 32px",
          display: "flex",
          gap: 0,
          overflowX: "auto",
        }}
      >
        {NAV_CATEGORIES.map(({ label, href }) => {
          const fullHref = brandToken && brand
            ? (href === "/marketplace"
                ? `/marketplace?brand_id=${brand.id}`
                : `${href}&brand_id=${brand.id}`)
            : href;
          const isActive =
            pathname === "/marketplace" &&
            (href === "/marketplace" ? !urlCategory : urlCategory === label);
          return (
            <Link
              key={label}
              href={fullHref}
              style={{
                padding: "9px 14px",
                fontSize: 10,
                fontWeight: isActive ? 700 : 500,
                letterSpacing: "0.15em",
                textTransform: "uppercase",
                color: isActive ? "#111" : "#888",
                textDecoration: "none",
                borderBottom: isActive ? "2px solid #111" : "2px solid transparent",
                whiteSpace: "nowrap",
                transition: "color 0.15s, border-color 0.15s",
              }}
            >
              {label}
            </Link>
          );
        })}
      </div>
    </div>
  );
}

function IconButton({ href, label, children }: { href: string; label: string; children: React.ReactNode }) {
  const [hov, setHov] = useState(false);
  return (
    <Link
      href={href}
      title={label}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{ display: "flex", alignItems: "center", color: hov ? "#111" : "#666", textDecoration: "none", transition: "color 0.15s" }}
    >
      {children}
    </Link>
  );
}

function HeartIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
    </svg>
  );
}

function MannequinIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="4" r="2.2" />
      <path d="M9 8h6l1 6H8L9 8z" />
      <path d="M9 14l-2 6" />
      <path d="M15 14l2 6" />
    </svg>
  );
}

function CartIcon({ count }: { count: number }) {
  const [hov, setHov] = useState(false);
  return (
    <Link
      href="/cart"
      title="Carrito"
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{ position: "relative", display: "flex", alignItems: "center", color: hov ? "#111" : "#666", textDecoration: "none", transition: "color 0.15s" }}
    >
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" />
        <line x1="3" y1="6" x2="21" y2="6" />
        <path d="M16 10a4 4 0 01-8 0" />
      </svg>
      {count > 0 && (
        <span style={{ position: "absolute", top: -6, right: -8, backgroundColor: "#111", color: "#fff", fontSize: 9, fontWeight: 700, minWidth: 16, height: 16, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", lineHeight: 1, padding: "0 3px" }}>
          {count > 99 ? "99+" : count}
        </span>
      )}
    </Link>
  );
}

function BellIcon({ count }: { count: number }) {
  const [hov, setHov] = useState(false);
  return (
    <Link
      href="/notifications"
      title="Alertas de stock"
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{ position: "relative", display: "flex", alignItems: "center", color: hov ? "#111" : "#666", textDecoration: "none", transition: "color 0.15s" }}
    >
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
        <path d="M13.73 21a2 2 0 0 1-3.46 0" />
      </svg>
      {count > 0 && (
        <span style={{ position: "absolute", top: -6, right: -8, backgroundColor: "#b45309", color: "#fff", fontSize: 9, fontWeight: 700, minWidth: 16, height: 16, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", lineHeight: 1, padding: "0 3px" }}>
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
      style={{ fontSize: 11, fontWeight: 500, letterSpacing: "0.1em", textTransform: "uppercase", color: hov ? "#111" : "#888", textDecoration: "none", transition: "color 0.15s" }}
    >
      {children}
    </Link>
  );
}
