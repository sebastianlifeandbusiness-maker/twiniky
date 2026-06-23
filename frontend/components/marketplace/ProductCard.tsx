"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { Product } from "@/types";
import { formatCLP } from "@/lib/utils/format";
import { useAuthStore } from "@/lib/store/auth";
import { useFavoritesStore } from "@/lib/store/favorites";
import { favoritesApi } from "@/lib/api";

function isNew(createdAt: string) {
  return Date.now() - new Date(createdAt).getTime() < 1000 * 60 * 60 * 24 * 30;
}

export function ProductCard({ product }: { product: Product }) {
  const router = useRouter();
  const { token } = useAuthStore();
  const { ids, add, remove } = useFavoritesStore();
  const [hovered, setHovered] = useState(false);
  const [favLoading, setFavLoading] = useState(false);

  const isFav = ids.includes(product.id);
  const hasSecond = product.image_urls.length > 1;
  const imgSrc = hovered && hasSecond ? product.image_urls[1] : product.image_urls[0];
  const showNew = isNew(product.created_at);
  const showLast = product.stock > 0 && product.stock <= 5;

  function handleTryOn(e: React.MouseEvent) {
    e.preventDefault();
    if (!token) {
      router.push(`/login?product=${product.id}`);
      return;
    }
    router.push(`/avatar/setup?product=${product.id}`);
  }

  async function handleFavorite(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (!token) { router.push("/login"); return; }
    if (favLoading) return;
    setFavLoading(true);
    try {
      if (isFav) {
        await favoritesApi.remove(product.id);
        remove(product.id);
      } else {
        await favoritesApi.add(product.id);
        add(product.id);
      }
    } catch {
      // revert si falla: el estado no cambia porque solo mutamos después del await
    } finally {
      setFavLoading(false);
    }
  }

  return (
    <Link
      href={`/marketplace/${product.id}`}
      style={{ display: "block", textDecoration: "none", color: "inherit" }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* ── Imagen ── */}
      <div
        style={{
          position: "relative",
          width: "100%",
          paddingBottom: "133.33%",
          backgroundColor: "#f5f5f3",
          overflow: "hidden",
        }}
      >
        {imgSrc ? (
          <img
            src={imgSrc}
            alt={product.name}
            style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", transition: "opacity 0.35s ease" }}
          />
        ) : (
          <div style={{ position: "absolute", inset: 0, backgroundColor: "#eeecea" }} />
        )}

        {/* Badges */}
        {showNew && (
          <span style={{ position: "absolute", top: 10, left: 10, backgroundColor: "#fff", color: "#111", fontSize: 9, fontWeight: 700, padding: "3px 8px", letterSpacing: "0.15em", textTransform: "uppercase" }}>
            Nuevo
          </span>
        )}
        {showLast && (
          <span style={{ position: "absolute", top: showNew ? 34 : 10, left: 10, backgroundColor: "#111", color: "#fff", fontSize: 9, fontWeight: 700, padding: "3px 8px", letterSpacing: "0.15em", textTransform: "uppercase" }}>
            Últimas
          </span>
        )}

        {/* Botón favorito — top right */}
        <button
          onClick={handleFavorite}
          title={isFav ? "Quitar de favoritos" : "Agregar a favoritos"}
          style={{
            position: "absolute",
            top: 8,
            right: 8,
            width: 30,
            height: 30,
            borderRadius: "50%",
            backgroundColor: "rgba(255,255,255,0.9)",
            border: "none",
            cursor: favLoading ? "wait" : "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 0,
            opacity: hovered || isFav ? 1 : 0,
            transition: "opacity 0.2s",
          }}
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill={isFav ? "#e11d48" : "none"}
            stroke={isFav ? "#e11d48" : "#555"}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
          </svg>
        </button>

        {/* CTA probar */}
        <div
          onClick={handleTryOn}
          style={{
            position: "absolute", bottom: 0, left: 0, right: 0,
            backgroundColor: "rgba(255,255,255,0.95)", color: "#111",
            fontSize: 10, fontWeight: 700, letterSpacing: "0.22em",
            textTransform: "uppercase", textAlign: "center",
            padding: "13px 0", cursor: "pointer",
            transform: hovered ? "translateY(0)" : "translateY(100%)",
            transition: "transform 0.25s ease",
          }}
        >
          Probar Ahora
        </div>
      </div>

      {/* ── Info ── */}
      <div style={{ paddingTop: 12 }}>
        {product.brand && (
          <p style={{ margin: "0 0 4px", fontSize: 10, color: "#9b9b97", textTransform: "uppercase", letterSpacing: "0.22em" }}>
            {product.brand}
          </p>
        )}
        <p style={{ margin: "0 0 3px", fontSize: 13, color: "#1a1a1a", lineHeight: 1.4, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {product.name}
        </p>
        <p style={{ margin: 0, fontSize: 13, fontWeight: 500, color: "#1a1a1a" }}>
          {formatCLP(product.price)}
        </p>
        {product.sizes.length > 0 && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginTop: 8 }}>
            {product.sizes.slice(0, 6).map((s) => (
              <span key={s} style={{ fontSize: 9, color: "#9b9b97", border: "1px solid #e0e0dc", padding: "2px 5px", lineHeight: 1.4 }}>
                {s}
              </span>
            ))}
            {product.sizes.length > 6 && (
              <span style={{ fontSize: 9, color: "#9b9b97" }}>+{product.sizes.length - 6}</span>
            )}
          </div>
        )}
      </div>
    </Link>
  );
}
