"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { Product } from "@/types";
import { formatCLP } from "@/lib/utils/format";

function isNew(createdAt: string) {
  return Date.now() - new Date(createdAt).getTime() < 1000 * 60 * 60 * 24 * 30;
}

export function ProductCard({ product }: { product: Product }) {
  const router = useRouter();
  const [hovered, setHovered] = useState(false);

  const hasSecond = product.image_urls.length > 1;
  const imgSrc =
    hovered && hasSecond ? product.image_urls[1] : product.image_urls[0];

  function handleTryOn(e: React.MouseEvent) {
    e.preventDefault();
    router.push(`/tryon?product=${product.id}`);
  }

  const showNew = isNew(product.created_at);
  const showLast = product.stock > 0 && product.stock <= 5;

  return (
    <Link
      href={`/marketplace/${product.id}`}
      style={{ display: "block", textDecoration: "none", color: "inherit" }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* ── Image ── */}
      <div
        style={{
          position: "relative",
          width: "100%",
          paddingBottom: "133.33%", // 3 : 4
          backgroundColor: "#f5f5f3",
          overflow: "hidden",
        }}
      >
        {imgSrc ? (
          <img
            src={imgSrc}
            alt={product.name}
            style={{
              position: "absolute",
              inset: 0,
              width: "100%",
              height: "100%",
              objectFit: "cover",
              transition: "opacity 0.35s ease",
            }}
          />
        ) : (
          <div
            style={{ position: "absolute", inset: 0, backgroundColor: "#eeecea" }}
          />
        )}

        {/* Badges */}
        {showNew && (
          <span
            style={{
              position: "absolute",
              top: 10,
              left: 10,
              backgroundColor: "#fff",
              color: "#111",
              fontSize: 9,
              fontWeight: 700,
              padding: "3px 8px",
              letterSpacing: "0.15em",
              textTransform: "uppercase",
            }}
          >
            Nuevo
          </span>
        )}
        {showLast && (
          <span
            style={{
              position: "absolute",
              top: showNew ? 34 : 10,
              left: 10,
              backgroundColor: "#111",
              color: "#fff",
              fontSize: 9,
              fontWeight: 700,
              padding: "3px 8px",
              letterSpacing: "0.15em",
              textTransform: "uppercase",
            }}
          >
            Últimas
          </span>
        )}

        {/* CTA — slide up on hover */}
        <div
          onClick={handleTryOn}
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            backgroundColor: "rgba(255,255,255,0.95)",
            color: "#111",
            fontSize: 10,
            fontWeight: 700,
            letterSpacing: "0.22em",
            textTransform: "uppercase",
            textAlign: "center",
            padding: "13px 0",
            cursor: "pointer",
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
          <p
            style={{
              margin: "0 0 4px",
              fontSize: 10,
              color: "#9b9b97",
              textTransform: "uppercase",
              letterSpacing: "0.22em",
            }}
          >
            {product.brand}
          </p>
        )}

        <p
          style={{
            margin: "0 0 3px",
            fontSize: 13,
            color: "#1a1a1a",
            lineHeight: 1.4,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {product.name}
        </p>

        <p style={{ margin: 0, fontSize: 13, fontWeight: 500, color: "#1a1a1a" }}>
          {formatCLP(product.price)}
        </p>

        {/* Size chips */}
        {product.sizes.length > 0 && (
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: 4,
              marginTop: 8,
            }}
          >
            {product.sizes.slice(0, 6).map((s) => (
              <span
                key={s}
                style={{
                  fontSize: 9,
                  color: "#9b9b97",
                  border: "1px solid #e0e0dc",
                  padding: "2px 5px",
                  lineHeight: 1.4,
                }}
              >
                {s}
              </span>
            ))}
            {product.sizes.length > 6 && (
              <span style={{ fontSize: 9, color: "#9b9b97" }}>
                +{product.sizes.length - 6}
              </span>
            )}
          </div>
        )}
      </div>
    </Link>
  );
}
