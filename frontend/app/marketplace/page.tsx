"use client";

import { useMemo, useState } from "react";
import { useProducts } from "@/lib/hooks/useProducts";
import { ProductCard } from "@/components/marketplace/ProductCard";
import { ProductFilters } from "@/components/marketplace/ProductFilters";

const CATEGORIES = [
  "Todos",
  "Tops",
  "Pantalones",
  "Vestidos",
  "Chaquetas",
  "Zapatos",
  "Accesorios",
];

const SORT_OPTIONS = [
  { value: "newest", label: "Más nuevos" },
  { value: "price_asc", label: "Precio: menor a mayor" },
  { value: "price_desc", label: "Precio: mayor a menor" },
  { value: "name_az", label: "Nombre: A–Z" },
];

function SkeletonCard() {
  return (
    <div>
      <div
        className="tw-skeleton"
        style={{ width: "100%", paddingBottom: "133.33%" }}
      />
      <div style={{ paddingTop: 12 }}>
        <div
          className="tw-skeleton"
          style={{ height: 8, width: "40%", marginBottom: 6 }}
        />
        <div
          className="tw-skeleton"
          style={{ height: 11, width: "75%", marginBottom: 5 }}
        />
        <div
          className="tw-skeleton"
          style={{ height: 11, width: "25%" }}
        />
      </div>
    </div>
  );
}

function CategoryTab({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  const [hov, setHov] = useState(false);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        flexShrink: 0,
        padding: "14px 18px",
        fontSize: 10,
        fontWeight: 700,
        letterSpacing: "0.22em",
        textTransform: "uppercase",
        background: "none",
        border: "none",
        borderBottom: `2px solid ${active ? "#111" : "transparent"}`,
        color: active ? "#111" : hov ? "#555" : "#aaa",
        cursor: "pointer",
        whiteSpace: "nowrap",
        transition: "color 0.15s",
      }}
    >
      {label}
    </button>
  );
}

export default function MarketplacePage() {
  const [activeCategory, setActiveCategory] = useState("Todos");
  const [selectedSizes, setSelectedSizes] = useState<string[]>([]);
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 500]);
  const [sortBy, setSortBy] = useState("newest");
  const [search, setSearch] = useState("");

  const { data: raw, isLoading } = useProducts({
    category: activeCategory !== "Todos" ? activeCategory : undefined,
    q: search || undefined,
  });

  const products = useMemo(() => {
    if (!raw) return [];
    return raw
      .filter(
        (p) =>
          selectedSizes.length === 0 ||
          p.sizes.some((s) => selectedSizes.includes(s))
      )
      .filter(
        (p) =>
          Number(p.price) >= priceRange[0] &&
          (priceRange[1] >= 500 || Number(p.price) <= priceRange[1])
      )
      .sort((a, b) => {
        if (sortBy === "price_asc") return Number(a.price) - Number(b.price);
        if (sortBy === "price_desc") return Number(b.price) - Number(a.price);
        if (sortBy === "name_az") return a.name.localeCompare(b.name);
        return (
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
      });
  }, [raw, selectedSizes, priceRange, sortBy]);

  function toggleSize(size: string) {
    setSelectedSizes((prev) =>
      prev.includes(size) ? prev.filter((s) => s !== size) : [...prev, size]
    );
  }

  function clearFilters() {
    setSelectedSizes([]);
    setPriceRange([0, 500]);
  }

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#fff", fontFamily: "inherit" }}>

      {/* ── Page header ── */}
      <div
        style={{
          borderBottom: "1px solid #ebebeb",
          padding: "28px 40px",
          display: "flex",
          alignItems: "flex-end",
          justifyContent: "space-between",
          gap: 16,
          flexWrap: "wrap",
        }}
      >
        <div>
          <h1
            style={{
              margin: 0,
              fontSize: 22,
              fontWeight: 300,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              color: "#111",
            }}
          >
            Catálogo
          </h1>
          <p style={{ margin: "4px 0 0", fontSize: 12, color: "#aaa", letterSpacing: "0.05em" }}>
            Descubre la colección
          </p>
        </div>

        {/* Search */}
        <div style={{ position: "relative" }}>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar prendas…"
            style={{
              width: 220,
              border: "none",
              borderBottom: "1px solid #d0d0cc",
              padding: "6px 28px 6px 0",
              fontSize: 13,
              color: "#333",
              outline: "none",
              backgroundColor: "transparent",
            }}
          />
          <svg
            style={{
              position: "absolute",
              right: 0,
              top: "50%",
              transform: "translateY(-50%)",
              width: 15,
              height: 15,
              color: "#bbb",
              pointerEvents: "none",
            }}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.8}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </div>
      </div>

      {/* ── Category tabs ── */}
      <div
        style={{
          position: "sticky",
          top: 0,
          backgroundColor: "#fff",
          borderBottom: "1px solid #ebebeb",
          zIndex: 20,
          overflowX: "auto",
          display: "flex",
          padding: "0 32px",
        }}
      >
        {CATEGORIES.map((cat) => (
          <CategoryTab
            key={cat}
            label={cat}
            active={activeCategory === cat}
            onClick={() => setActiveCategory(cat)}
          />
        ))}
      </div>

      {/* ── Body ── */}
      <div style={{ display: "flex", maxWidth: 1440, margin: "0 auto" }}>

        {/* Sidebar */}
        <aside
          style={{
            width: 220,
            flexShrink: 0,
            borderRight: "1px solid #ebebeb",
            padding: "32px 24px",
            minHeight: "80vh",
          }}
        >
          <div style={{ position: "sticky", top: 57 }}>
            <p
              style={{
                margin: "0 0 24px",
                fontSize: 10,
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: "0.22em",
                color: "#aaa",
              }}
            >
              Filtros
            </p>
            <ProductFilters
              selectedSizes={selectedSizes}
              onSizeChange={toggleSize}
              priceRange={priceRange}
              onPriceRangeChange={setPriceRange}
              onClear={clearFilters}
            />
          </div>
        </aside>

        {/* Products */}
        <div style={{ flex: 1, padding: "32px 40px", minWidth: 0 }}>

          {/* Sort bar */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 32,
            }}
          >
            <span style={{ fontSize: 12, color: "#aaa" }}>
              {isLoading ? (
                <span
                  className="tw-skeleton"
                  style={{ display: "inline-block", width: 80, height: 12 }}
                />
              ) : (
                <>
                  <strong style={{ color: "#333", fontWeight: 500 }}>
                    {products.length}
                  </strong>{" "}
                  {products.length === 1 ? "producto" : "productos"}
                </>
              )}
            </span>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              style={{
                fontSize: 11,
                color: "#555",
                border: "none",
                borderBottom: "1px solid #d0d0cc",
                padding: "4px 20px 4px 0",
                backgroundColor: "transparent",
                outline: "none",
                cursor: "pointer",
                letterSpacing: "0.05em",
                appearance: "none",
                WebkitAppearance: "none",
              }}
            >
              {SORT_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>

          {/* Grid */}
          {isLoading ? (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
                gap: "48px 20px",
              }}
            >
              {Array.from({ length: 8 }).map((_, i) => (
                <SkeletonCard key={i} />
              ))}
            </div>
          ) : products.length === 0 ? (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                padding: "80px 0",
                textAlign: "center",
              }}
            >
              <p
                style={{
                  fontSize: 20,
                  fontWeight: 300,
                  color: "#ccc",
                  letterSpacing: "0.08em",
                  margin: "0 0 10px",
                }}
              >
                Sin resultados
              </p>
              <p style={{ fontSize: 13, color: "#aaa", margin: "0 0 24px" }}>
                Prueba con otros filtros o categorías
              </p>
              <button
                onClick={() => {
                  setActiveCategory("Todos");
                  clearFilters();
                  setSearch("");
                }}
                style={{
                  background: "none",
                  border: "none",
                  fontSize: 10,
                  textTransform: "uppercase",
                  letterSpacing: "0.2em",
                  color: "#888",
                  cursor: "pointer",
                  textDecoration: "underline",
                  textUnderlineOffset: 3,
                }}
              >
                Ver todo el catálogo
              </button>
            </div>
          ) : (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
                gap: "48px 20px",
              }}
            >
              {products.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
