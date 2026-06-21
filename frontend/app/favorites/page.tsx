"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/store/auth";
import { useFavoritesStore } from "@/lib/store/favorites";
import { favoritesApi } from "@/lib/api";
import { formatCLP } from "@/lib/utils/format";
import type { Product } from "@/types";

export default function FavoritesPage() {
  const router = useRouter();
  const { token } = useAuthStore();
  const { ids, remove } = useFavoritesStore();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    if (!mounted) return;
    if (!token) { router.push("/login"); return; }
    favoritesApi.list()
      .then(({ data }) => setProducts(data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [mounted, token, router]);

  // Mantener la lista local sincronizada cuando se quitan favoritos
  const visibleProducts = products.filter((p) => ids.includes(p.id));

  async function handleRemove(productId: string) {
    try {
      await favoritesApi.remove(productId);
      remove(productId);
    } catch { /* ignore */ }
  }

  if (!mounted || !token) return null;

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#fff" }}>

      {/* Header */}
      <div style={{ borderBottom: "1px solid #ebebeb", padding: "28px 40px", display: "flex", alignItems: "flex-end", justifyContent: "space-between" }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 300, letterSpacing: "0.12em", textTransform: "uppercase", color: "#111" }}>
            Favoritos
          </h1>
          <p style={{ margin: "4px 0 0", fontSize: 12, color: "#aaa", letterSpacing: "0.05em" }}>
            {loading ? "Cargando…" : `${visibleProducts.length} ${visibleProducts.length === 1 ? "producto" : "productos"} guardados`}
          </p>
        </div>
        <Link
          href="/marketplace"
          style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.18em", textTransform: "uppercase", color: "#888", textDecoration: "none", borderBottom: "1px solid #ddd", paddingBottom: 2 }}
        >
          Ver catálogo →
        </Link>
      </div>

      <div style={{ maxWidth: 1440, margin: "0 auto", padding: "40px 40px 80px" }}>

        {loading ? (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "48px 20px" }}>
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i}>
                <div className="tw-skeleton" style={{ width: "100%", paddingBottom: "133.33%", marginBottom: 12 }} />
                <div className="tw-skeleton" style={{ height: 8, width: "35%", marginBottom: 5 }} />
                <div className="tw-skeleton" style={{ height: 11, width: "80%" }} />
              </div>
            ))}
          </div>
        ) : visibleProducts.length === 0 ? (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "80px 0", textAlign: "center" }}>
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#ddd" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: 20 }}>
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
            </svg>
            <p style={{ fontSize: 20, fontWeight: 300, color: "#ccc", margin: "0 0 10px", letterSpacing: "0.08em" }}>
              Aún no tienes favoritos
            </p>
            <p style={{ fontSize: 13, color: "#aaa", margin: "0 0 28px" }}>
              Haz clic en el corazón de cualquier prenda para guardarla aquí
            </p>
            <Link
              href="/marketplace"
              style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.2em", textTransform: "uppercase", color: "#111", textDecoration: "none", border: "1px solid #111", padding: "12px 28px" }}
            >
              Explorar catálogo
            </Link>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "48px 20px" }}>
            {visibleProducts.map((product) => (
              <FavoriteCard key={product.id} product={product} onRemove={handleRemove} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function FavoriteCard({ product, onRemove }: { product: Product; onRemove: (id: string) => void }) {
  const [hovered, setHovered] = useState(false);
  const [removing, setRemoving] = useState(false);

  async function handleRemove(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (removing) return;
    setRemoving(true);
    await onRemove(product.id);
  }

  return (
    <Link
      href={`/marketplace/${product.id}`}
      style={{ display: "block", textDecoration: "none", color: "inherit", opacity: removing ? 0.4 : 1, transition: "opacity 0.2s" }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div style={{ position: "relative", width: "100%", paddingBottom: "133.33%", backgroundColor: "#f5f5f3", overflow: "hidden", marginBottom: 12 }}>
        {product.image_urls[0] ? (
          <img src={product.image_urls[0]} alt={product.name} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} />
        ) : (
          <div style={{ position: "absolute", inset: 0, backgroundColor: "#eeecea" }} />
        )}

        {/* Quitar favorito */}
        <button
          onClick={handleRemove}
          title="Quitar de favoritos"
          style={{
            position: "absolute", top: 8, right: 8,
            width: 30, height: 30, borderRadius: "50%",
            backgroundColor: "rgba(255,255,255,0.9)", border: "none",
            cursor: removing ? "wait" : "pointer",
            display: "flex", alignItems: "center", justifyContent: "center", padding: 0,
            opacity: hovered ? 1 : 0.8, transition: "opacity 0.2s",
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="#e11d48" stroke="#e11d48" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
          </svg>
        </button>
      </div>

      {product.brand && (
        <p style={{ margin: "0 0 4px", fontSize: 10, color: "#9b9b97", textTransform: "uppercase", letterSpacing: "0.22em" }}>
          {product.brand}
        </p>
      )}
      <p style={{ margin: "0 0 3px", fontSize: 13, color: "#1a1a1a", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
        {product.name}
      </p>
      <p style={{ margin: 0, fontSize: 13, fontWeight: 500, color: "#1a1a1a" }}>
        {formatCLP(product.price)}
      </p>
    </Link>
  );
}
