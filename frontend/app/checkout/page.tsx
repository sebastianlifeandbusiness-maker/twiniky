"use client";

import { useState, useEffect, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { useCartStore, cartTotal, type CartItem } from "@/lib/store/cart";
import { useAuthStore } from "@/lib/store/auth";
import { checkoutApi } from "@/lib/api";
import { formatCLP, FREE_SHIPPING_THRESHOLD, SHIPPING_COST } from "@/lib/utils/format";

interface FormData {
  full_name: string;
  email: string;
  phone: string;
  street: string;
  number: string;
  city: string;
  region: string;
  zip: string;
}

const EMPTY_FORM: FormData = {
  full_name: "",
  email: "",
  phone: "",
  street: "",
  number: "",
  city: "",
  region: "",
  zip: "",
};

export default function CheckoutPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const { items, clearCart } = useCartStore();
  const user = useAuthStore((s) => s.user);
  const token = useAuthStore((s) => s.token);

  const [form, setForm] = useState<FormData>({ ...EMPTY_FORM, email: user?.email ?? "", full_name: user?.full_name ?? "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted && items.length === 0) {
      router.replace("/cart");
    }
  }, [mounted, items.length, router]);

  if (!mounted) return null;

  if (items.length === 0) {
    return null;
  }

  const total = cartTotal(items);
  const shipping = total >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_COST;
  const finalTotal = total + shipping;

  function set(field: keyof FormData) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setForm((prev) => ({ ...prev, [field]: e.target.value }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    const required: (keyof FormData)[] = ["full_name", "email", "street", "number", "city", "region", "zip"];
    for (const f of required) {
      if (!form[f].trim()) {
        setError("Por favor completa todos los campos obligatorios.");
        return;
      }
    }

    const shippingAddress = JSON.stringify({
      full_name: form.full_name,
      email: form.email,
      phone: form.phone,
      street: `${form.street} ${form.number}`,
      city: form.city,
      region: form.region,
      zip: form.zip,
    });

    const payload = {
      items: items.map((item) => ({
        product_id: item.product.id,
        quantity: item.quantity,
        size: item.size,
      })),
      shipping_address: shippingAddress,
    };

    try {
      setLoading(true);
      const res = await checkoutApi.submit(payload);
      const orders = res.data;
      clearCart();
      const firstId = orders[0]?.id ?? "unknown";
      router.push(`/order-confirmation?order_id=${firstId}`);
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail ??
        "Error al procesar el pedido. Inténtalo de nuevo.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ backgroundColor: "#fff", minHeight: "100vh" }}>
      {/* Header */}
      <div style={{ borderBottom: "1px solid #ebebeb", padding: "28px 40px" }}>
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
          Finalizar compra
        </h1>
      </div>

      <form onSubmit={handleSubmit}>
        <div
          style={{
            maxWidth: 1100,
            margin: "0 auto",
            padding: "40px 40px 80px",
            display: "grid",
            gridTemplateColumns: "1fr 340px",
            gap: 48,
            alignItems: "start",
          }}
        >
          {/* ── Left: Form ── */}
          <div>
            {/* Section: Personal data */}
            <SectionTitle>Datos personales</SectionTitle>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 32 }}>
              <Field label="Nombre completo *" value={form.full_name} onChange={set("full_name")} placeholder="María García" />
              <Field label="Email *" type="email" value={form.email} onChange={set("email")} placeholder="maria@ejemplo.com" />
              <Field label="Teléfono" value={form.phone} onChange={set("phone")} placeholder="+56 9 1234 5678" />
            </div>

            {/* Section: Shipping address */}
            <SectionTitle>Dirección de envío</SectionTitle>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 160px", gap: 16 }}>
              <Field label="Calle *" value={form.street} onChange={set("street")} placeholder="Av. Providencia" />
              <Field label="Número *" value={form.number} onChange={set("number")} placeholder="1234" />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginTop: 16 }}>
              <Field label="Ciudad *" value={form.city} onChange={set("city")} placeholder="Santiago" />
              <RegionSelect value={form.region} onChange={set("region")} />
              <Field label="Código postal *" value={form.zip} onChange={set("zip")} placeholder="7500000" />
            </div>

            {/* Error */}
            {error && (
              <p
                style={{
                  marginTop: 20,
                  padding: "12px 16px",
                  backgroundColor: "#fff5f5",
                  border: "1px solid #fecaca",
                  borderRadius: 4,
                  color: "#dc2626",
                  fontSize: 13,
                }}
              >
                {error}
              </p>
            )}
          </div>

          {/* ── Right: Summary ── */}
          <CheckoutSummary items={items} total={total} shipping={shipping} finalTotal={finalTotal} loading={loading} />
        </div>
      </form>
    </div>
  );
}

/* ── Sub-components ── */

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2
      style={{
        margin: "0 0 16px",
        fontSize: 10,
        fontWeight: 700,
        letterSpacing: "0.22em",
        textTransform: "uppercase",
        color: "#111",
        paddingBottom: 8,
        borderBottom: "1px solid #ebebeb",
      }}
    >
      {children}
    </h2>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  type?: string;
}) {
  const [focus, setFocus] = useState(false);
  return (
    <div>
      <label
        style={{
          display: "block",
          fontSize: 9,
          fontWeight: 700,
          letterSpacing: "0.18em",
          textTransform: "uppercase",
          color: "#888",
          marginBottom: 6,
        }}
      >
        {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={onChange}
        onFocus={() => setFocus(true)}
        onBlur={() => setFocus(false)}
        placeholder={placeholder}
        style={{
          width: "100%",
          padding: "10px 12px",
          fontSize: 13,
          color: "#111",
          backgroundColor: "#fff",
          border: `1px solid ${focus ? "#111" : "#e0e0e0"}`,
          outline: "none",
          boxSizing: "border-box",
          transition: "border-color 0.15s",
        }}
      />
    </div>
  );
}

const REGIONS = [
  "Región Metropolitana",
  "Región de Valparaíso",
  "Región del Biobío",
  "Región de La Araucanía",
  "Región de Los Lagos",
  "Región de Antofagasta",
  "Región de Atacama",
  "Región de Coquimbo",
  "Región del Maule",
  "Región de O'Higgins",
  "Región del Ñuble",
  "Región de Los Ríos",
  "Región de Aysén",
  "Región de Magallanes",
  "Región de Tarapacá",
  "Región de Arica y Parinacota",
];

function RegionSelect({
  value,
  onChange,
}: {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
}) {
  const [focus, setFocus] = useState(false);
  return (
    <div>
      <label
        style={{
          display: "block",
          fontSize: 9,
          fontWeight: 700,
          letterSpacing: "0.18em",
          textTransform: "uppercase",
          color: "#888",
          marginBottom: 6,
        }}
      >
        Región *
      </label>
      <select
        value={value}
        onChange={onChange}
        onFocus={() => setFocus(true)}
        onBlur={() => setFocus(false)}
        style={{
          width: "100%",
          padding: "10px 12px",
          fontSize: 13,
          color: value ? "#111" : "#aaa",
          backgroundColor: "#fff",
          border: `1px solid ${focus ? "#111" : "#e0e0e0"}`,
          outline: "none",
          boxSizing: "border-box",
          appearance: "none",
          cursor: "pointer",
          transition: "border-color 0.15s",
        }}
      >
        <option value="">Selecciona una región</option>
        {REGIONS.map((r) => (
          <option key={r} value={r}>
            {r}
          </option>
        ))}
      </select>
    </div>
  );
}

function CheckoutSummary({
  items,
  total,
  shipping,
  finalTotal,
  loading,
}: {
  items: CartItem[];
  total: number;
  shipping: number;
  finalTotal: number;
  loading: boolean;
}) {
  const [hov, setHov] = useState(false);

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
        Tu pedido
      </h2>

      {/* Items */}
      <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 20 }}>
        {items.map((item) => (
          <div
            key={`${item.product.id}::${item.size}`}
            style={{ display: "flex", gap: 12, alignItems: "center" }}
          >
            {/* Thumbnail */}
            <div
              style={{
                width: 52,
                flexShrink: 0,
                paddingBottom: "69.33%", // ~3:4 at 52px
                position: "relative",
                backgroundColor: "#f0f0ee",
                overflow: "hidden",
              }}
            >
              {item.product.image_urls[0] && (
                <img
                  src={item.product.image_urls[0]}
                  alt={item.product.name}
                  style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }}
                />
              )}
            </div>
            {/* Info */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <p
                style={{
                  margin: 0,
                  fontSize: 12,
                  color: "#111",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {item.product.name}
              </p>
              {item.size && (
                <p style={{ margin: "2px 0 0", fontSize: 10, color: "#aaa", textTransform: "uppercase" }}>
                  Talla: {item.size}
                </p>
              )}
              <p style={{ margin: "2px 0 0", fontSize: 10, color: "#aaa" }}>
                ×{item.quantity}
              </p>
            </div>
            {/* Price */}
            <p style={{ margin: 0, fontSize: 12, color: "#333", flexShrink: 0 }}>
              {formatCLP(Math.round(Number(item.product.price)) * item.quantity)}
            </p>
          </div>
        ))}
      </div>

      <div style={{ borderTop: "1px solid #e8e8e4", paddingTop: 16 }}>
        <Row label="Subtotal" value={formatCLP(total)} />
        <Row
          label="Envío"
          value={shipping === 0 ? "Gratis" : formatCLP(shipping)}
          valueColor={shipping === 0 ? "#16a34a" : undefined}
        />
        {shipping > 0 && (
          <p style={{ margin: "-4px 0 8px", fontSize: 10, color: "#aaa" }}>
            Envío gratis en pedidos superiores a $50.000
          </p>
        )}
      </div>

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

      <button
        type="submit"
        disabled={loading}
        onMouseEnter={() => setHov(true)}
        onMouseLeave={() => setHov(false)}
        style={{
          width: "100%",
          padding: "15px 0",
          fontSize: 11,
          fontWeight: 700,
          letterSpacing: "0.22em",
          textTransform: "uppercase",
          backgroundColor: loading ? "#888" : hov ? "#222" : "#111",
          color: "#fff",
          border: "none",
          cursor: loading ? "not-allowed" : "pointer",
          transition: "background 0.2s",
          marginBottom: 12,
        }}
      >
        {loading ? "Procesando..." : "Confirmar compra"}
      </button>

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

function Row({
  label,
  value,
  valueColor,
}: {
  label: string;
  value: string;
  valueColor?: string;
}) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        fontSize: 12,
        color: "#666",
        marginBottom: 8,
      }}
    >
      <span>{label}</span>
      <span style={{ color: valueColor }}>{value}</span>
    </div>
  );
}
