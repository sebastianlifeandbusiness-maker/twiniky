"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { ProductCard } from "@/components/marketplace/ProductCard";
import { ProductFilters, type BrandOption } from "@/components/marketplace/ProductFilters";
import { useBrandStore } from "@/lib/store/brand";
import type { Brand, Product } from "@/types";

const MAX_PRICE = 120000;

export default function HomePage() {
  const router = useRouter();
  const { token: brandToken } = useBrandStore();

  useEffect(() => {
    if (brandToken) router.push("/brands/dashboard");
  }, [brandToken]); // eslint-disable-line react-hooks/exhaustive-deps

  const { data: brands } = useQuery<Brand[]>({
    queryKey: ["brands-strip"],
    queryFn: async () => { const { data } = await api.get("/brands/"); return data; },
    staleTime: 1000 * 60 * 5,
  });

  const { data: allProducts } = useQuery<Product[]>({
    queryKey: ["products-home"],
    queryFn: async () => { const { data } = await api.get("/products/", { params: { limit: 100 } }); return data; },
    staleTime: 1000 * 60 * 5,
  });

  /* ── filter state ── */
  const [selectedSizes,     setSelectedSizes]    = useState<string[]>([]);
  const [priceRange,        setPriceRange]       = useState<[number, number]>([0, MAX_PRICE]);
  const [selectedBrands,    setSelectedBrands]   = useState<string[]>([]);
  const [selectedColors,    setSelectedColors]   = useState<string[]>([]);
  const [selectedOccasions, setSelectedOccasions]= useState<string[]>([]);
  const [sortBy,            setSortBy]           = useState("newest");

  const brandOptions = useMemo<BrandOption[]>(() => {
    const map: Record<string, { name: string; count: number }> = {};
    (allProducts ?? []).forEach((p) => {
      if (p.brand && p.brand_id) {
        if (!map[p.brand_id]) map[p.brand_id] = { name: p.brand, count: 0 };
        map[p.brand_id].count++;
      }
    });
    return Object.entries(map).map(([id, { name, count }]) => ({ id, name, count }));
  }, [allProducts]);

  const filteredProducts = useMemo(() => {
    if (!allProducts) return [];
    return allProducts
      .filter((p) => selectedSizes.length    === 0 || p.sizes.some((s) => selectedSizes.includes(s)))
      .filter((p) => selectedBrands.length   === 0 || (p.brand_id != null && selectedBrands.includes(p.brand_id)))
      .filter((p) => selectedColors.length   === 0 || (p.color != null && selectedColors.includes(p.color)))
      .filter((p) => selectedOccasions.length === 0 || (p.occasions ?? []).some((o) => selectedOccasions.includes(o)))
      .filter((p) => Number(p.price) >= priceRange[0] && (priceRange[1] >= MAX_PRICE || Number(p.price) <= priceRange[1]))
      .sort((a, b) => {
        if (sortBy === "price_asc")  return Number(a.price) - Number(b.price);
        if (sortBy === "price_desc") return Number(b.price) - Number(a.price);
        if (sortBy === "name_az")    return a.name.localeCompare(b.name);
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      });
  }, [allProducts, selectedSizes, selectedBrands, selectedColors, selectedOccasions, priceRange, sortBy]);

  function toggleSize(s: string) {
    setSelectedSizes((prev) => prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]);
  }
  function toggleBrand(id: string) {
    setSelectedBrands((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);
  }
  function toggleColor(c: string) {
    setSelectedColors((prev) => prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c]);
  }
  function toggleOccasion(o: string) {
    setSelectedOccasions((prev) => prev.includes(o) ? prev.filter((x) => x !== o) : [...prev, o]);
  }
  function clearFilters() {
    setSelectedSizes([]); setSelectedBrands([]);
    setSelectedColors([]); setSelectedOccasions([]);
    setPriceRange([0, MAX_PRICE]);
  }

  /* collage: primeras 4 imágenes de productos distintos */
  const heroImages = (allProducts ?? [])
    .filter((p) => p.image_urls.length > 0)
    .slice(0, 4)
    .map((p) => p.image_urls[0]);

  return (
    <div style={{ backgroundColor: "#fff" }}>

      {/* ── HERO ── */}
      <section style={{ maxWidth: 1440, margin: "0 auto", padding: "80px 40px 72px", display: "flex", alignItems: "center", gap: 60 }}>
        {/* Texto izquierda */}
        <div style={{ flex: "0 0 auto", maxWidth: 520 }}>
          <p style={{ margin: "0 0 18px", fontSize: 10, fontWeight: 700, letterSpacing: "0.3em", textTransform: "uppercase", color: "#aaa" }}>
            Marketplace de moda · Chile
          </p>
          <h1 style={{ margin: "0 0 24px", fontSize: "clamp(34px, 5vw, 64px)", fontWeight: 300, letterSpacing: "0.02em", color: "#111", lineHeight: 1.1 }}>
            Todas las marcas.<br />Tu estilo.<br />Sin límites.
          </h1>
          <p style={{ margin: "0 0 40px", fontSize: 15, color: "#777", lineHeight: 1.75, maxWidth: 400 }}>
            Descubre moda chilena real con probador virtual 3D. Visualiza cómo te queda cada prenda antes de pagar.
          </p>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            <Link href="/marketplace" style={{ padding: "14px 36px", backgroundColor: "#111", color: "#fff", fontSize: 11, fontWeight: 700, letterSpacing: "0.2em", textTransform: "uppercase", textDecoration: "none" }}>
              Explorar productos
            </Link>
            <Link href="/brands" style={{ padding: "14px 36px", backgroundColor: "transparent", color: "#111", fontSize: 11, fontWeight: 700, letterSpacing: "0.2em", textTransform: "uppercase", textDecoration: "none", border: "1px solid #ccc" }}>
              Para marcas
            </Link>
          </div>
        </div>

        {/* Visual derecha: collage 2×2 */}
        <div style={{ flex: 1, minWidth: 0 }}>
          {heroImages.length >= 2 ? (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gridTemplateRows: "1fr 1fr", gap: 6, aspectRatio: "1 / 0.9", maxHeight: 460 }}>
              {heroImages.slice(0, 4).map((url, i) => (
                <div key={i} style={{ overflow: "hidden", backgroundColor: "#f5f5f5" }}>
                  <img src={url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                </div>
              ))}
              {/* Si hay menos de 4, rellena con gris */}
              {Array.from({ length: Math.max(0, 4 - heroImages.length) }).map((_, i) => (
                <div key={`placeholder-${i}`} style={{ backgroundColor: "#f0f0f0" }} />
              ))}
            </div>
          ) : (
            /* Fallback SVG mientras cargan productos */
            <div style={{ aspectRatio: "1 / 0.9", maxHeight: 460, backgroundColor: "#f5f5f5", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <svg width="72" height="72" viewBox="0 0 24 24" fill="none" stroke="#ccc" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="4" r="2.2" />
                <path d="M9 8h6l1 6H8L9 8z" />
                <path d="M9 14l-2 6" /><path d="M15 14l2 6" />
              </svg>
            </div>
          )}
        </div>
      </section>

      {/* ── STRIP DE MARCAS ── */}
      {brands && brands.length > 0 && (
        <section style={{ borderTop: "1px solid #f0f0f0", borderBottom: "1px solid #f0f0f0", overflow: "hidden", padding: "20px 0" }}>
          <BrandStrip brands={brands} />
        </section>
      )}

      {/* ── 4 PERKS ── */}
      <section style={{ maxWidth: 1440, margin: "0 auto", padding: "72px 40px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 32, textAlign: "center" }}>
          {PERKS.map(({ icon, title, desc }) => (
            <div key={title} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 14 }}>
              <div style={{ width: 52, height: 52, border: "1px solid #eee", display: "flex", alignItems: "center", justifyContent: "center" }}>
                {icon}
              </div>
              <p style={{ margin: 0, fontSize: 11, fontWeight: 700, letterSpacing: "0.18em", textTransform: "uppercase", color: "#111" }}>{title}</p>
              <p style={{ margin: 0, fontSize: 12, color: "#999", lineHeight: 1.6 }}>{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── BANNER PROBADOR 3D ── */}
      <section style={{ backgroundColor: "#0a0a0a", margin: "0 40px 72px", maxWidth: 1360, marginLeft: "auto", marginRight: "auto", padding: "80px 64px", display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", width: 600, height: 600, borderRadius: "50%", background: "radial-gradient(circle, rgba(255,255,255,0.03) 0%, transparent 70%)", pointerEvents: "none" }} />
        <p style={{ margin: "0 0 20px", fontSize: 10, fontWeight: 700, letterSpacing: "0.3em", textTransform: "uppercase", color: "#555" }}>Próximamente</p>
        <svg width="52" height="52" viewBox="0 0 24 24" fill="none" stroke="#444" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: 28 }}>
          <circle cx="12" cy="4" r="2.2" />
          <path d="M9 8h6l1 6H8L9 8z" />
          <path d="M9 14l-2 6" /><path d="M15 14l2 6" />
        </svg>
        <h2 style={{ margin: "0 0 20px", fontSize: "clamp(28px, 4vw, 52px)", fontWeight: 300, letterSpacing: "0.04em", color: "#fff", lineHeight: 1.15, maxWidth: 640 }}>
          Tu cuerpo exacto en 3D.<br />Pruébate antes de comprar.
        </h2>
        <p style={{ margin: "0 0 40px", fontSize: 15, color: "#666", maxWidth: 460, lineHeight: 1.7 }}>
          Sube dos fotos y crea tu avatar 3D personalizado. Pruébate cualquier prenda del catálogo antes de pagar. Devuelves nada.
        </p>
        <Link href="/tryon-waitlist" style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "14px 36px", backgroundColor: "#fff", color: "#111", fontSize: 11, fontWeight: 700, letterSpacing: "0.2em", textTransform: "uppercase", textDecoration: "none" }}>
          Quiero probarlo →
        </Link>
        <p style={{ marginTop: 20, fontSize: 11, color: "#444", letterSpacing: "0.05em" }}>Sé el primero en acceder · Lista de espera gratuita</p>
      </section>

      {/* ── TODOS LOS PRODUCTOS ── */}
      <section style={{ maxWidth: 1440, margin: "0 auto", padding: "0 40px 96px" }}>
        {/* Header sección */}
        <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 36 }}>
          <h2 style={{ margin: 0, fontSize: 14, fontWeight: 700, letterSpacing: "0.2em", textTransform: "uppercase", color: "#111" }}>
            Todos los productos
          </h2>
          <Link href="/marketplace" style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.18em", textTransform: "uppercase", color: "#888", textDecoration: "none", borderBottom: "1px solid #ddd", paddingBottom: 2 }}>
            Ver catálogo completo →
          </Link>
        </div>

        {/* Layout 2 columnas */}
        <div style={{ display: "flex", gap: 0 }}>

          {/* Sidebar */}
          <aside style={{ width: 240, flexShrink: 0, borderRight: "1px solid #f0f0f0", paddingRight: 28, paddingTop: 8 }}>
            <div style={{ position: "sticky", top: 106 }}>
              <p style={{ margin: "0 0 20px", fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.22em", color: "#aaa" }}>
                Filtros
              </p>
              <ProductFilters
                selectedSizes={selectedSizes}
                onSizeChange={toggleSize}
                priceRange={priceRange}
                onPriceRangeChange={setPriceRange}
                onClear={clearFilters}
                brandOptions={brandOptions}
                selectedBrands={selectedBrands}
                onBrandChange={toggleBrand}
                selectedColors={selectedColors}
                onColorChange={toggleColor}
                selectedOccasions={selectedOccasions}
                onOccasionChange={toggleOccasion}
              />
            </div>
          </aside>

          {/* Products */}
          <div style={{ flex: 1, paddingLeft: 40, minWidth: 0 }}>
            {/* Sort bar */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 28 }}>
              <span style={{ fontSize: 12, color: "#aaa" }}>
                {allProducts == null ? (
                  <span className="tw-skeleton" style={{ display: "inline-block", width: 80, height: 12 }} />
                ) : (
                  <><strong style={{ color: "#333", fontWeight: 500 }}>{filteredProducts.length}</strong>{" "}{filteredProducts.length === 1 ? "producto" : "productos"}</>
                )}
              </span>
              <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}
                style={{ fontSize: 11, color: "#555", border: "none", borderBottom: "1px solid #d0d0cc", padding: "4px 20px 4px 0", backgroundColor: "transparent", outline: "none", cursor: "pointer", letterSpacing: "0.05em", appearance: "none", WebkitAppearance: "none" }}>
                <option value="newest">Más nuevos</option>
                <option value="price_asc">Precio: menor a mayor</option>
                <option value="price_desc">Precio: mayor a menor</option>
                <option value="name_az">Nombre: A–Z</option>
              </select>
            </div>

            {allProducts == null ? (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "48px 20px" }}>
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i}>
                    <div className="tw-skeleton" style={{ width: "100%", paddingBottom: "133.33%", marginBottom: 12 }} />
                    <div className="tw-skeleton" style={{ height: 8, width: "40%", marginBottom: 6 }} />
                    <div className="tw-skeleton" style={{ height: 11, width: "75%" }} />
                  </div>
                ))}
              </div>
            ) : filteredProducts.length === 0 ? (
              <div style={{ padding: "60px 0", textAlign: "center" }}>
                <p style={{ fontSize: 16, fontWeight: 300, color: "#ccc", margin: "0 0 8px" }}>Sin resultados</p>
                <button onClick={clearFilters} style={{ background: "none", border: "none", fontSize: 10, textTransform: "uppercase", letterSpacing: "0.15em", color: "#888", cursor: "pointer", textDecoration: "underline", textUnderlineOffset: 3 }}>
                  Limpiar filtros
                </button>
              </div>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "48px 20px" }}>
                {filteredProducts.map((p) => <ProductCard key={p.id} product={p} />)}
              </div>
            )}
          </div>
        </div>
      </section>

    </div>
  );
}

/* ── Strip de marcas con scroll automático ── */
const BRAND_LOCAL_LOGOS: Record<string, string> = {
  "Nike":           "/logos/nike.png",
  "Adidas":         "/logos/adidas.png",
  "Zara":           "/logos/zara.png",
  "H&M":            "/logos/hm.png",
  "Lacoste":        "/logos/lacoste.png",
  "Tommy Hilfiger": "/logos/tommy.png",
  "Calvin Klein":   "/logos/calvinklein.png",
  "Levis":          "/logos/levis.png",
  "New Balance":    "/logos/newbalance.png",
  "Puma":           "/logos/puma.png",
  "Diesel":         "/logos/diesel.png",
  "Hugo Boss":      "/logos/hugoboss.png",
  "Americanino":    "/logos/americanino.png",
  "Caterpillar":    "/logos/caterpillar.png",
  "Sparta":         "/logos/sparta.png",
  "Klazi":          "/logos/klazi.png",
  "MAUI":           "/logos/maui.png",
  "Ferouch":        "/logos/ferouch.png",
};

function BrandItem({ brand }: { brand: Brand }) {
  const [hovered, setHovered] = useState(false);
  const localLogo = BRAND_LOCAL_LOGOS[brand.name];
  if (localLogo) {
    return (
      <img
        src={localLogo}
        alt={brand.name}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{
          height: 42,
          width: "auto",
          maxWidth: 120,
          objectFit: "contain",
          flexShrink: 0,
          filter: hovered ? "none" : "grayscale(100%) opacity(0.45)",
          transition: "filter 0.25s",
          userSelect: "none",
        }}
      />
    );
  }
  return (
    <span
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        fontSize: 15,
        fontWeight: 800,
        letterSpacing: "0.08em",
        textTransform: "uppercase",
        color: hovered ? "#111" : "#555",
        flexShrink: 0,
        transition: "color 0.25s",
        userSelect: "none",
      }}
    >
      {brand.name}
    </span>
  );
}

function BrandStrip({ brands }: { brands: Brand[] }) {
  const [offset, setOffset] = useState(0);
  const doubled = [...brands, ...brands];

  useEffect(() => {
    const id = setInterval(() => {
      setOffset((o) => (o + 1) % (brands.length * 180));
    }, 30);
    return () => clearInterval(id);
  }, [brands.length]);

  return (
    <div style={{ overflow: "hidden", position: "relative" }}>
      <div style={{ display: "flex", gap: 80, alignItems: "center", transform: `translateX(-${offset}px)`, transition: "none", whiteSpace: "nowrap" }}>
        {doubled.map((b, i) => (
          <BrandItem key={`${b.id}-${i}`} brand={b} />
        ))}
      </div>
    </div>
  );
}

/* ── Perks data ── */
const PERKS = [
  {
    title: "Envíos rápidos",
    desc: "Despacho a todo Chile en 2–5 días hábiles.",
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#111" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
        <rect x="1" y="3" width="15" height="13" rx="1" /><polygon points="16 8 20 8 23 11 23 16 16 16 16 8" /><circle cx="5.5" cy="18.5" r="2.5" /><circle cx="18.5" cy="18.5" r="2.5" />
      </svg>
    ),
  },
  {
    title: "Talla perfecta",
    desc: "Avatar 3D que recuerda tus medidas exactas.",
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#111" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="4" r="2" /><path d="M9 7h6l1 5H8L9 7z" /><path d="M9 12l-2 8" /><path d="M15 12l2 8" />
      </svg>
    ),
  },
  {
    title: "Pago seguro",
    desc: "Transacciones cifradas y protegidas.",
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#111" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      </svg>
    ),
  },
  {
    title: "Miles de productos",
    desc: "Cientos de marcas chilenas en un solo lugar.",
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#111" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
        <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" /><line x1="3" y1="6" x2="21" y2="6" /><path d="M16 10a4 4 0 01-8 0" />
      </svg>
    ),
  },
];
