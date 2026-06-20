"use client";

import { use, useState } from "react";
import Link from "next/link";
import { useProduct } from "@/lib/hooks/useProducts";
import { useCartStore } from "@/lib/store/cart";
import { useBrandStore } from "@/lib/store/brand";
import { useRouter } from "next/navigation";
import { formatCLP } from "@/lib/utils/format";

interface Props {
  params: Promise<{ id: string }>;
}

export default function ProductDetailPage({ params }: Props) {
  const { id } = use(params);
  const { data: product, isLoading, isError } = useProduct(id);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [activeImg, setActiveImg] = useState(0);
  const [added, setAdded] = useState(false);
  const [blockMsg, setBlockMsg] = useState<string | null>(null);
  const router = useRouter();
  const addItem = useCartStore((s) => s.addItem);
  const { brand: activeBrand } = useBrandStore();

  function handleAddToCart() {
    if (!product) return;
    if (activeBrand && product.brand_id && product.brand_id === activeBrand.id) {
      setBlockMsg("No puedes comprar productos de tu propia marca.");
      setTimeout(() => setBlockMsg(null), 2500);
      return;
    }
    addItem(product, selectedSize);
    setAdded(true);
    setTimeout(() => setAdded(false), 1800);
  }

  /* ── Loading ── */
  if (isLoading) {
    return (
      <div
        style={{
          maxWidth: 1100,
          margin: "0 auto",
          padding: "40px 32px",
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 60,
        }}
      >
        <div
          className="tw-skeleton"
          style={{ width: "100%", paddingBottom: "133.33%" }}
        />
        <div style={{ paddingTop: 8 }}>
          {[40, 160, 60, 80, 80].map((w, i) => (
            <div
              key={i}
              className="tw-skeleton"
              style={{ height: i === 1 ? 26 : 14, width: `${w}%`, marginBottom: 18 }}
            />
          ))}
        </div>
      </div>
    );
  }

  /* ── Error ── */
  if (isError || !product) {
    return (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "60vh",
          textAlign: "center",
          padding: 32,
        }}
      >
        <p style={{ fontSize: 20, fontWeight: 300, color: "#ccc", margin: "0 0 16px" }}>
          Producto no encontrado
        </p>
        <Link
          href="/marketplace"
          style={{
            fontSize: 10,
            textTransform: "uppercase",
            letterSpacing: "0.2em",
            color: "#888",
            textDecoration: "underline",
            textUnderlineOffset: 3,
          }}
        >
          Volver al catálogo
        </Link>
      </div>
    );
  }

  const images = product.image_urls;

  return (
    <div style={{ backgroundColor: "#fff", minHeight: "100vh" }}>

      {/* Breadcrumb */}
      <div
        style={{
          maxWidth: 1100,
          margin: "0 auto",
          padding: "16px 32px",
          display: "flex",
          alignItems: "center",
          gap: 8,
          fontSize: 10,
          textTransform: "uppercase",
          letterSpacing: "0.15em",
          color: "#aaa",
        }}
      >
        <Link href="/marketplace" style={{ color: "#aaa" }}>
          Catálogo
        </Link>
        <span>/</span>
        <span>{product.category}</span>
        <span>/</span>
        <span
          style={{
            color: "#555",
            maxWidth: 200,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {product.name}
        </span>
      </div>

      {/* ── Main content ── */}
      <div
        style={{
          maxWidth: 1100,
          margin: "0 auto",
          padding: "0 32px 64px",
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 64,
          alignItems: "start",
        }}
      >
        {/* ── Gallery ── */}
        <div style={{ display: "flex", gap: 12 }}>
          {/* Thumbnails */}
          {images.length > 1 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 8, width: 62, flexShrink: 0 }}>
              {images.map((url, i) => (
                <button
                  key={i}
                  onClick={() => setActiveImg(i)}
                  style={{
                    padding: 0,
                    background: "none",
                    border: `2px solid ${activeImg === i ? "#111" : "transparent"}`,
                    cursor: "pointer",
                    opacity: activeImg === i ? 1 : 0.55,
                    transition: "opacity 0.2s",
                  }}
                >
                  <div
                    style={{
                      position: "relative",
                      width: "100%",
                      paddingBottom: "133.33%",
                      overflow: "hidden",
                      backgroundColor: "#f5f5f3",
                    }}
                  >
                    <img
                      src={url}
                      alt={`Vista ${i + 1}`}
                      style={{
                        position: "absolute",
                        inset: 0,
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                      }}
                    />
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* Main image */}
          <div
            style={{
              flex: 1,
              position: "relative",
              paddingBottom: images.length > 1 ? "0" : "133.33%",
              aspectRatio: images.length > 1 ? "3/4" : undefined,
              backgroundColor: "#f5f5f3",
              overflow: "hidden",
            }}
          >
            {images[activeImg] ? (
              <img
                src={images[activeImg]}
                alt={product.name}
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                  display: "block",
                }}
              />
            ) : (
              <div style={{ backgroundColor: "#eeecea", width: "100%", height: "100%" }} />
            )}
          </div>
        </div>

        {/* ── Info ── */}
        <div style={{ paddingTop: 8 }}>
          {/* Brand */}
          {product.brand && (
            <p
              style={{
                margin: "0 0 8px",
                fontSize: 10,
                textTransform: "uppercase",
                letterSpacing: "0.25em",
                color: "#aaa",
              }}
            >
              {product.brand}
            </p>
          )}

          {/* Name */}
          <h1
            style={{
              margin: "0 0 14px",
              fontSize: 24,
              fontWeight: 300,
              color: "#111",
              lineHeight: 1.3,
            }}
          >
            {product.name}
          </h1>

          {/* Price */}
          <p
            style={{
              margin: "0 0 18px",
              fontSize: 18,
              fontWeight: 500,
              color: "#111",
            }}
          >
            {formatCLP(product.price)}
          </p>

          {/* Description */}
          {product.description && (
            <p
              style={{
                margin: "0 0 24px",
                fontSize: 13,
                color: "#666",
                lineHeight: 1.7,
              }}
            >
              {product.description}
            </p>
          )}

          <hr style={{ border: "none", borderTop: "1px solid #ebebeb", margin: "0 0 24px" }} />

          {/* Size selector */}
          {product.sizes.length > 0 && (
            <div style={{ marginBottom: 24 }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: 12,
                }}
              >
                <p
                  style={{
                    margin: 0,
                    fontSize: 10,
                    fontWeight: 700,
                    textTransform: "uppercase",
                    letterSpacing: "0.2em",
                    color: "#333",
                  }}
                >
                  Talla{selectedSize ? ` — ${selectedSize}` : ""}
                </p>
                <button
                  style={{
                    background: "none",
                    border: "none",
                    fontSize: 10,
                    textTransform: "uppercase",
                    letterSpacing: "0.1em",
                    color: "#aaa",
                    cursor: "pointer",
                    textDecoration: "underline",
                    textUnderlineOffset: 2,
                    padding: 0,
                  }}
                >
                  Guía de tallas
                </button>
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {product.sizes.map((size) => (
                  <SizeBtn
                    key={size}
                    size={size}
                    selected={selectedSize === size}
                    onClick={() =>
                      setSelectedSize(size === selectedSize ? null : size)
                    }
                  />
                ))}
              </div>
            </div>
          )}

          {/* Stock warning */}
          {product.stock > 0 && product.stock <= 5 && (
            <p
              style={{
                margin: "0 0 16px",
                fontSize: 11,
                color: "#b45309",
                letterSpacing: "0.05em",
              }}
            >
              Solo quedan {product.stock} unidades
            </p>
          )}

          {/* Actions */}
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <TryOnBtn productId={product.id} />

            <AddToCartBtn
              needsSize={product.sizes.length > 0 && !selectedSize}
              added={added}
              blocked={!!blockMsg}
              onClick={handleAddToCart}
            />

            {blockMsg && (
              <p
                style={{
                  margin: 0,
                  fontSize: 11,
                  color: "#dc2626",
                  letterSpacing: "0.03em",
                  textAlign: "center",
                }}
              >
                {blockMsg}
              </p>
            )}
          </div>

          {/* Meta */}
          <div
            style={{
              marginTop: 24,
              paddingTop: 20,
              borderTop: "1px solid #ebebeb",
              display: "flex",
              flexDirection: "column",
              gap: 6,
            }}
          >
            <p style={{ margin: 0, fontSize: 10, textTransform: "uppercase", letterSpacing: "0.15em", color: "#aaa" }}>
              Categoría: <span style={{ color: "#666" }}>{product.category}</span>
            </p>
            {product.stock > 5 && (
              <p style={{ margin: 0, fontSize: 10, textTransform: "uppercase", letterSpacing: "0.15em", color: "#aaa" }}>
                Disponibilidad:{" "}
                <span style={{ color: "#16a34a" }}>En stock ({product.stock})</span>
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── local sub-components ─── */

function SizeBtn({
  size,
  selected,
  onClick,
}: {
  size: string;
  selected: boolean;
  onClick: () => void;
}) {
  const [hov, setHov] = useState(false);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        minWidth: 46,
        padding: "8px 10px",
        fontSize: 11,
        cursor: "pointer",
        border: `1px solid ${selected ? "#111" : hov ? "#888" : "#ddddd9"}`,
        backgroundColor: selected ? "#111" : "transparent",
        color: selected ? "#fff" : "#555",
        transition: "all 0.15s",
        textAlign: "center",
      }}
    >
      {size}
    </button>
  );
}

function AddToCartBtn({
  needsSize,
  added,
  blocked,
  onClick,
}: {
  needsSize: boolean;
  added: boolean;
  blocked: boolean;
  onClick: () => void;
}) {
  const [hov, setHov] = useState(false);
  const disabled = needsSize;

  let label = "Agregar al carrito";
  if (needsSize) label = "Selecciona una talla";
  if (added) label = "✓ Añadido al carrito";
  if (blocked) label = "No disponible para tu marca";

  const bg = added ? "#16a34a" : blocked ? "#fee2e2" : hov && !disabled ? "#111" : "transparent";
  const color = added ? "#fff" : blocked ? "#dc2626" : hov && !disabled ? "#fff" : "#111";
  const border = added ? "1px solid #16a34a" : blocked ? "1px solid #fecaca" : "1px solid #111";

  return (
    <button
      disabled={disabled}
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        width: "100%",
        padding: "14px 0",
        fontSize: 11,
        fontWeight: 600,
        letterSpacing: "0.2em",
        textTransform: "uppercase",
        border,
        backgroundColor: bg,
        color,
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.3 : 1,
        transition: "all 0.2s",
      }}
    >
      {label}
    </button>
  );
}

function TryOnBtn({ productId }: { productId: string }) {
  const router = useRouter();
  const [hov, setHov] = useState(false);
  return (
    <button
      onClick={() => router.push(`/tryon?product=${productId}`)}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        width: "100%",
        padding: "14px 0",
        fontSize: 11,
        fontWeight: 600,
        letterSpacing: "0.2em",
        textTransform: "uppercase",
        border: "2px solid #111",
        backgroundColor: hov ? "#111" : "#fff",
        color: hov ? "#fff" : "#111",
        cursor: "pointer",
        transition: "all 0.2s",
      }}
    >
      Probar en 3D
    </button>
  );
}
