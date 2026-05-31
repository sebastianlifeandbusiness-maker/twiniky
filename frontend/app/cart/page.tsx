"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCartStore, cartTotal, cartCount, type CartItem } from "@/lib/store/cart";
import { formatCLP, FREE_SHIPPING_THRESHOLD, SHIPPING_COST } from "@/lib/utils/format";

export default function CartPage() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const { items, removeItem, updateQuantity, clearCart } = useCartStore();
  const total = cartTotal(items);
  const count = cartCount(items);

  if (!mounted) return null;

  /* ── Empty state ── */
  if (items.length === 0) {
    return (
      <div
        style={{
          minHeight: "70vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          textAlign: "center",
          padding: 32,
          backgroundColor: "#fff",
        }}
      >
        <svg
          width="48"
          height="48"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#ccc"
          strokeWidth="1.2"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{ marginBottom: 20 }}
        >
          <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" />
          <line x1="3" y1="6" x2="21" y2="6" />
          <path d="M16 10a4 4 0 01-8 0" />
        </svg>
        <p
          style={{
            fontSize: 20,
            fontWeight: 300,
            letterSpacing: "0.06em",
            color: "#bbb",
            margin: "0 0 8px",
          }}
        >
          Tu carrito está vacío
        </p>
        <p style={{ fontSize: 13, color: "#aaa", margin: "0 0 28px" }}>
          Explora el catálogo y añade tus prendas favoritas
        </p>
        <Link
          href="/marketplace"
          style={{
            fontSize: 10,
            fontWeight: 700,
            letterSpacing: "0.2em",
            textTransform: "uppercase",
            color: "#fff",
            backgroundColor: "#111",
            padding: "12px 28px",
            textDecoration: "none",
            transition: "opacity 0.2s",
          }}
        >
          Ir al catálogo
        </Link>
      </div>
    );
  }

  return (
    <div style={{ backgroundColor: "#fff", minHeight: "100vh" }}>

      {/* ── Header ── */}
      <div
        style={{
          borderBottom: "1px solid #ebebeb",
          padding: "28px 40px",
        }}
      >
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
          Mi Carrito
        </h1>
        <p style={{ margin: "4px 0 0", fontSize: 12, color: "#aaa" }}>
          {count} {count === 1 ? "artículo" : "artículos"}
        </p>
      </div>

      {/* ── Body ── */}
      <div
        style={{
          maxWidth: 1200,
          margin: "0 auto",
          padding: "40px 40px 80px",
          display: "grid",
          gridTemplateColumns: "1fr 360px",
          gap: 48,
          alignItems: "start",
        }}
      >
        {/* ── Items list ── */}
        <div>
          {/* Column header */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "80px 1fr 120px 100px 32px",
              gap: 16,
              paddingBottom: 12,
              borderBottom: "1px solid #ebebeb",
              fontSize: 9,
              fontWeight: 700,
              letterSpacing: "0.2em",
              textTransform: "uppercase",
              color: "#aaa",
            }}
          >
            <span />
            <span>Producto</span>
            <span style={{ textAlign: "center" }}>Cantidad</span>
            <span style={{ textAlign: "right" }}>Precio</span>
            <span />
          </div>

          {/* Rows */}
          {items.map((item) => (
            <CartRow
              key={`${item.product.id}::${item.size}`}
              item={item}
              onRemove={() => removeItem(item.product.id, item.size)}
              onQtyChange={(qty) =>
                updateQuantity(item.product.id, item.size, qty)
              }
            />
          ))}

          {/* Footer links */}
          <div
            style={{
              marginTop: 24,
              paddingTop: 20,
              borderTop: "1px solid #ebebeb",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <Link
              href="/marketplace"
              style={{
                fontSize: 10,
                textTransform: "uppercase",
                letterSpacing: "0.15em",
                color: "#888",
                textDecoration: "underline",
                textUnderlineOffset: 3,
              }}
            >
              ← Seguir comprando
            </Link>
            <button
              onClick={clearCart}
              style={{
                background: "none",
                border: "none",
                fontSize: 10,
                textTransform: "uppercase",
                letterSpacing: "0.15em",
                color: "#ccc",
                cursor: "pointer",
                textDecoration: "underline",
                textUnderlineOffset: 3,
                padding: 0,
              }}
            >
              Vaciar carrito
            </button>
          </div>
        </div>

        {/* ── Order summary ── */}
        <OrderSummary items={items} total={total} />
      </div>
    </div>
  );
}

/* ─── CartRow ─── */

function CartRow({
  item,
  onRemove,
  onQtyChange,
}: {
  item: CartItem;
  onRemove: () => void;
  onQtyChange: (qty: number) => void;
}) {
  const subtotal = Math.round(Number(item.product.price)) * item.quantity;

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "80px 1fr 120px 100px 32px",
        gap: 16,
        alignItems: "center",
        padding: "20px 0",
        borderBottom: "1px solid #f5f5f3",
      }}
    >
      {/* Image */}
      <Link href={`/marketplace/${item.product.id}`} style={{ display: "block" }}>
        <div
          style={{
            width: 80,
            paddingBottom: "106.67%", // ~3:4 at 80px wide
            position: "relative",
            backgroundColor: "#f5f5f3",
            overflow: "hidden",
          }}
        >
          {item.product.image_urls[0] && (
            <img
              src={item.product.image_urls[0]}
              alt={item.product.name}
              style={{
                position: "absolute",
                inset: 0,
                width: "100%",
                height: "100%",
                objectFit: "cover",
              }}
            />
          )}
        </div>
      </Link>

      {/* Info */}
      <div>
        {item.product.brand && (
          <p
            style={{
              margin: "0 0 4px",
              fontSize: 9,
              color: "#bbb",
              textTransform: "uppercase",
              letterSpacing: "0.2em",
            }}
          >
            {item.product.brand}
          </p>
        )}
        <Link
          href={`/marketplace/${item.product.id}`}
          style={{
            fontSize: 13,
            color: "#111",
            textDecoration: "none",
            lineHeight: 1.4,
            display: "block",
            marginBottom: 4,
          }}
        >
          {item.product.name}
        </Link>
        {item.size && (
          <p
            style={{
              margin: 0,
              fontSize: 10,
              color: "#aaa",
              textTransform: "uppercase",
              letterSpacing: "0.1em",
            }}
          >
            Talla: {item.size}
          </p>
        )}
      </div>

      {/* Qty stepper */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 0,
          border: "1px solid #e8e8e4",
          width: "fit-content",
          margin: "0 auto",
        }}
      >
        <QtyButton
          label="−"
          onClick={() => onQtyChange(item.quantity - 1)}
        />
        <span
          style={{
            minWidth: 36,
            textAlign: "center",
            fontSize: 12,
            color: "#333",
            padding: "6px 0",
            borderLeft: "1px solid #e8e8e4",
            borderRight: "1px solid #e8e8e4",
          }}
        >
          {item.quantity}
        </span>
        <QtyButton
          label="+"
          onClick={() => onQtyChange(item.quantity + 1)}
        />
      </div>

      {/* Price */}
      <p
        style={{
          margin: 0,
          fontSize: 13,
          fontWeight: 500,
          color: "#111",
          textAlign: "right",
        }}
      >
        {formatCLP(subtotal)}
      </p>

      {/* Remove */}
      <RemoveButton onClick={onRemove} />
    </div>
  );
}

function QtyButton({ label, onClick }: { label: string; onClick: () => void }) {
  const [hov, setHov] = useState(false);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        width: 32,
        height: 32,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: hov ? "#f5f5f3" : "none",
        border: "none",
        cursor: "pointer",
        fontSize: 14,
        color: "#555",
        flexShrink: 0,
        transition: "background 0.15s",
      }}
    >
      {label}
    </button>
  );
}

function RemoveButton({ onClick }: { onClick: () => void }) {
  const [hov, setHov] = useState(false);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      title="Eliminar"
      style={{
        background: "none",
        border: "none",
        cursor: "pointer",
        padding: 4,
        color: hov ? "#111" : "#ccc",
        transition: "color 0.15s",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <svg
        width="14"
        height="14"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      >
        <line x1="18" y1="6" x2="6" y2="18" />
        <line x1="6" y1="6" x2="18" y2="18" />
      </svg>
    </button>
  );
}

/* ─── Order Summary ─── */

function OrderSummary({ items, total }: { items: CartItem[]; total: number }) {
  const [hov, setHov] = useState(false);
  const router = useRouter();
  const shipping = total >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_COST;
  const finalTotal = total + shipping;

  function handleCheckout() {
    router.push("/checkout");
  }

  return (
    <div
      style={{
        position: "sticky",
        top: 80,
        border: "1px solid #ebebeb",
        padding: "28px 24px",
        backgroundColor: "#fafaf8",
      }}
    >
      <h2
        style={{
          margin: "0 0 20px",
          fontSize: 11,
          fontWeight: 700,
          letterSpacing: "0.2em",
          textTransform: "uppercase",
          color: "#111",
        }}
      >
        Resumen del pedido
      </h2>

      {/* Line items */}
      <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 20 }}>
        {items.map((item) => (
          <div
            key={`${item.product.id}::${item.size}`}
            style={{
              display: "flex",
              justifyContent: "space-between",
              fontSize: 12,
              color: "#555",
            }}
          >
            <span style={{ flex: 1, marginRight: 8, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {item.product.name}
              {item.size ? ` (${item.size})` : ""}
              {item.quantity > 1 ? ` ×${item.quantity}` : ""}
            </span>
            <span style={{ flexShrink: 0 }}>
              {formatCLP(Math.round(Number(item.product.price)) * item.quantity)}
            </span>
          </div>
        ))}
      </div>

      <div style={{ borderTop: "1px solid #e8e8e4", paddingTop: 16, marginBottom: 16 }}>
        {/* Subtotal */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            fontSize: 12,
            color: "#666",
            marginBottom: 8,
          }}
        >
          <span>Subtotal</span>
          <span>{formatCLP(total)}</span>
        </div>

        {/* Shipping */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            fontSize: 12,
            color: "#666",
            marginBottom: 8,
          }}
        >
          <span>Envío</span>
          <span style={{ color: shipping === 0 ? "#16a34a" : "#333" }}>
            {shipping === 0 ? "Gratis" : formatCLP(shipping)}
          </span>
        </div>

        {shipping > 0 && (
          <p style={{ margin: "0 0 8px", fontSize: 10, color: "#aaa" }}>
            Envío gratis en pedidos superiores a $50.000
          </p>
        )}
      </div>

      {/* Total */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          fontSize: 15,
          fontWeight: 600,
          color: "#111",
          borderTop: "1px solid #e8e8e4",
          paddingTop: 16,
          marginBottom: 24,
        }}
      >
        <span>Total</span>
        <span>{formatCLP(finalTotal)}</span>
      </div>

      {/* CTA */}
      <button
        onClick={handleCheckout}
        onMouseEnter={() => setHov(true)}
        onMouseLeave={() => setHov(false)}
        style={{
          width: "100%",
          padding: "15px 0",
          fontSize: 11,
          fontWeight: 700,
          letterSpacing: "0.22em",
          textTransform: "uppercase",
          backgroundColor: hov ? "#222" : "#111",
          color: "#fff",
          border: "none",
          cursor: "pointer",
          transition: "background 0.2s",
          marginBottom: 12,
        }}
      >
        Proceder al pago
      </button>

      {/* Trust signals */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 6,
          fontSize: 10,
          color: "#aaa",
          letterSpacing: "0.05em",
        }}
      >
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
          <path d="M7 11V7a5 5 0 0110 0v4" />
        </svg>
        <span>Pago 100% seguro</span>
      </div>
    </div>
  );
}
