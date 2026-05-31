"use client";

import { useState, useEffect, FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { brandsApi, BrandProductPayload } from "@/lib/api";
import { useBrandStore } from "@/lib/store/brand";
import { formatCLP } from "@/lib/utils/format";
import type { Product } from "@/types";

const CATEGORIES = ["Tops", "Pantalones", "Vestidos", "Chaquetas", "Zapatos", "Accesorios"];
const ALL_SIZES = ["XS", "S", "M", "L", "XL", "XXL", "35", "36", "37", "38", "39", "40", "41", "42", "Único"];

const EMPTY_PRODUCT: BrandProductPayload = {
  name: "",
  description: "",
  price: 0,
  category: "",
  sizes: [],
  image_url: "",
  stock: 0,
};

export default function BrandDashboardPage() {
  const router = useRouter();
  const { brand, token, clearBrand } = useBrandStore();
  const [mounted, setMounted] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    if (mounted && !token) {
      router.push("/brands/login");
    }
  }, [mounted, token, router]);

  useEffect(() => {
    if (brand && token) {
      fetchProducts();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [brand, token]);

  async function fetchProducts() {
    if (!brand) return;
    setLoadingProducts(true);
    try {
      const { data } = await brandsApi.getProducts(brand.id);
      setProducts(data);
    } catch {
      // ignore
    } finally {
      setLoadingProducts(false);
    }
  }

  function handleLogout() {
    clearBrand();
    router.push("/brands/login");
  }

  if (!mounted || !brand || !token) return null;

  return (
    <div style={{ backgroundColor: "#fff", minHeight: "100vh" }}>

      {/* Header */}
      <div
        style={{
          borderBottom: "1px solid #ebebeb",
          padding: "28px 40px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 16,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          {brand.logo_url && (
            <img
              src={brand.logo_url}
              alt={brand.name}
              style={{ width: 44, height: 44, objectFit: "contain", border: "1px solid #ebebeb" }}
            />
          )}
          <div>
            <h1
              style={{
                margin: 0,
                fontSize: 20,
                fontWeight: 300,
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                color: "#111",
              }}
            >
              {brand.name}
            </h1>
            <p style={{ margin: "3px 0 0", fontSize: 12, color: "#aaa" }}>{brand.email}</p>
          </div>
        </div>
        <div style={{ display: "flex", gap: 12 }}>
          <button
            onClick={() => setShowAddForm(true)}
            style={{
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: "0.18em",
              textTransform: "uppercase",
              backgroundColor: "#111",
              color: "#fff",
              border: "none",
              padding: "10px 22px",
              cursor: "pointer",
            }}
          >
            + Agregar producto
          </button>
          <button
            onClick={handleLogout}
            style={{
              fontSize: 11,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              backgroundColor: "transparent",
              color: "#aaa",
              border: "1px solid #e0e0e0",
              padding: "10px 18px",
              cursor: "pointer",
            }}
          >
            Salir
          </button>
        </div>
      </div>

      {/* Body */}
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "40px 40px 80px" }}>

        {brand.description && (
          <div
            style={{
              marginBottom: 40,
              padding: "20px 24px",
              backgroundColor: "#fafaf8",
              border: "1px solid #ebebeb",
              maxWidth: 680,
            }}
          >
            <p style={{ margin: 0, fontSize: 13, color: "#666", lineHeight: 1.7 }}>
              {brand.description}
            </p>
          </div>
        )}

        <div style={{ display: "flex", gap: 24, marginBottom: 40, flexWrap: "wrap" }}>
          <StatBox label="Productos" value={String(products.length)} />
          <StatBox
            label="Stock total"
            value={String(products.reduce((sum, p) => sum + p.stock, 0))}
          />
          <StatBox
            label="Precio promedio"
            value={
              products.length > 0
                ? formatCLP(Math.round(products.reduce((sum, p) => sum + Number(p.price), 0) / products.length))
                : "—"
            }
          />
        </div>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
          <p style={{ margin: 0, fontSize: 10, fontWeight: 700, letterSpacing: "0.22em", textTransform: "uppercase", color: "#aaa" }}>
            Catálogo ({products.length})
          </p>
        </div>

        {loadingProducts ? (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "40px 20px" }}>
            {Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : products.length === 0 ? (
          <div style={{ padding: "60px 0", textAlign: "center", border: "1px dashed #e0e0e0" }}>
            <p style={{ fontSize: 15, fontWeight: 300, color: "#ccc", margin: "0 0 12px" }}>
              Aún no tienes productos
            </p>
            <p style={{ fontSize: 13, color: "#aaa", margin: "0 0 24px" }}>
              Agrega tu primer producto para aparecer en el catálogo de Twiniky
            </p>
            <button
              onClick={() => setShowAddForm(true)}
              style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.2em", textTransform: "uppercase", background: "none", border: "none", color: "#888", cursor: "pointer", textDecoration: "underline", textUnderlineOffset: 3 }}
            >
              Agregar primer producto
            </button>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "40px 20px" }}>
            {products.map((p) => <DashboardProductCard key={p.id} product={p} />)}
          </div>
        )}
      </div>

      {showAddForm && (
        <AddProductModal
          brandId={brand.id}
          onClose={() => setShowAddForm(false)}
          onCreated={(p) => {
            setProducts((prev) => [p, ...prev]);
            setShowAddForm(false);
          }}
        />
      )}
    </div>
  );
}

function StatBox({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ border: "1px solid #ebebeb", padding: "16px 24px", minWidth: 120 }}>
      <p style={{ margin: "0 0 4px", fontSize: 9, fontWeight: 700, letterSpacing: "0.2em", textTransform: "uppercase", color: "#aaa" }}>
        {label}
      </p>
      <p style={{ margin: 0, fontSize: 22, fontWeight: 500, color: "#111" }}>{value}</p>
    </div>
  );
}

function DashboardProductCard({ product }: { product: Product }) {
  return (
    <div>
      <div style={{ width: "100%", paddingBottom: "133.33%", position: "relative", backgroundColor: "#f5f5f3", overflow: "hidden", marginBottom: 12 }}>
        {product.image_urls[0] ? (
          <img src={product.image_urls[0]} alt={product.name} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} />
        ) : (
          <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#ccc" strokeWidth="1.2">
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <circle cx="8.5" cy="8.5" r="1.5" />
              <polyline points="21 15 16 10 5 21" />
            </svg>
          </div>
        )}
      </div>
      <p style={{ margin: "0 0 3px", fontSize: 9, color: "#bbb", textTransform: "uppercase", letterSpacing: "0.15em" }}>{product.category}</p>
      <p style={{ margin: "0 0 3px", fontSize: 13, color: "#111", lineHeight: 1.3 }}>{product.name}</p>
      <p style={{ margin: "0 0 4px", fontSize: 13, fontWeight: 500, color: "#111" }}>{formatCLP(product.price)}</p>
      <p style={{ margin: 0, fontSize: 10, color: "#aaa" }}>Stock: {product.stock} · Tallas: {product.sizes.join(", ") || "—"}</p>
    </div>
  );
}

function SkeletonCard() {
  return (
    <div>
      <div className="tw-skeleton" style={{ width: "100%", paddingBottom: "133.33%", marginBottom: 12 }} />
      <div className="tw-skeleton" style={{ height: 8, width: "35%", marginBottom: 5 }} />
      <div className="tw-skeleton" style={{ height: 11, width: "80%", marginBottom: 4 }} />
      <div className="tw-skeleton" style={{ height: 11, width: "30%" }} />
    </div>
  );
}

function AddProductModal({ brandId, onClose, onCreated }: { brandId: string; onClose: () => void; onCreated: (p: Product) => void }) {
  const { token } = useBrandStore();
  const [form, setForm] = useState<BrandProductPayload>({ ...EMPTY_PRODUCT });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function setField(field: keyof BrandProductPayload) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
      setForm((prev) => ({ ...prev, [field]: e.target.value }));
  }

  function toggleSize(size: string) {
    setForm((prev) => ({
      ...prev,
      sizes: prev.sizes.includes(size) ? prev.sizes.filter((s) => s !== size) : [...prev.sizes, size],
    }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (!form.name.trim() || !form.category || !form.price) {
      setError("Nombre, categoría y precio son obligatorios.");
      return;
    }
    try {
      setLoading(true);
      const { data } = await brandsApi.addProduct(brandId, {
        ...form,
        price: Number(form.price),
        stock: Number(form.stock) || 0,
        description: form.description || undefined,
        image_url: form.image_url || undefined,
      });
      onCreated(data);
    } catch (err: unknown) {
      const detail = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
      setError(detail ?? "No se pudo crear el producto.");
    } finally {
      setLoading(false);
    }
  }

  const labelStyle: React.CSSProperties = {
    display: "block",
    fontSize: 9,
    fontWeight: 700,
    letterSpacing: "0.18em",
    textTransform: "uppercase",
    color: "#888",
    marginBottom: 6,
  };

  return (
    <div
      style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.4)", zIndex: 50, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{ backgroundColor: "#fff", width: "100%", maxWidth: 560, maxHeight: "90vh", overflowY: "auto", padding: "36px 32px", position: "relative" }}>
        <button onClick={onClose} style={{ position: "absolute", top: 16, right: 16, background: "none", border: "none", cursor: "pointer", color: "#aaa" }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>

        <h2 style={{ margin: "0 0 28px", fontSize: 14, fontWeight: 700, letterSpacing: "0.18em", textTransform: "uppercase", color: "#111" }}>
          Nuevo producto
        </h2>

        <form onSubmit={handleSubmit}>
          <label style={labelStyle}>Nombre del producto *</label>
          <input type="text" value={form.name} onChange={setField("name")} placeholder="Ej: Blusa Satinada Marfil"
            style={{ width: "100%", padding: "10px 12px", fontSize: 13, color: "#111", border: "1px solid #e0e0e0", outline: "none", boxSizing: "border-box", marginBottom: 16, fontFamily: "inherit" }} />

          <label style={labelStyle}>Categoría *</label>
          <select value={form.category} onChange={setField("category")}
            style={{ width: "100%", padding: "10px 12px", fontSize: 13, color: form.category ? "#111" : "#aaa", backgroundColor: "#fff", border: "1px solid #e0e0e0", outline: "none", boxSizing: "border-box", marginBottom: 16, cursor: "pointer" }}>
            <option value="">Selecciona una categoría</option>
            {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
            <div>
              <label style={labelStyle}>Precio CLP *</label>
              <input type="number" value={String(form.price || "")} onChange={setField("price")} placeholder="29990"
                style={{ width: "100%", padding: "10px 12px", fontSize: 13, color: "#111", border: "1px solid #e0e0e0", outline: "none", boxSizing: "border-box", fontFamily: "inherit" }} />
            </div>
            <div>
              <label style={labelStyle}>Stock</label>
              <input type="number" value={String(form.stock || "")} onChange={setField("stock")} placeholder="10"
                style={{ width: "100%", padding: "10px 12px", fontSize: 13, color: "#111", border: "1px solid #e0e0e0", outline: "none", boxSizing: "border-box", fontFamily: "inherit" }} />
            </div>
          </div>

          <label style={labelStyle}>Descripción</label>
          <textarea value={form.description} onChange={setField("description")} placeholder="Describe la prenda..." rows={3}
            style={{ width: "100%", padding: "10px 12px", fontSize: 13, color: "#111", border: "1px solid #e0e0e0", outline: "none", boxSizing: "border-box", resize: "vertical", fontFamily: "inherit", marginBottom: 16 }} />

          <label style={labelStyle}>URL de imagen</label>
          <input type="text" value={form.image_url ?? ""} onChange={setField("image_url")} placeholder="https://..."
            style={{ width: "100%", padding: "10px 12px", fontSize: 13, color: "#111", border: "1px solid #e0e0e0", outline: "none", boxSizing: "border-box", marginBottom: 20, fontFamily: "inherit" }} />

          <label style={labelStyle}>Tallas disponibles</label>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 8, marginBottom: 20 }}>
            {ALL_SIZES.map((size) => {
              const active = form.sizes.includes(size);
              return (
                <button key={size} type="button" onClick={() => toggleSize(size)}
                  style={{ padding: "6px 12px", fontSize: 11, fontWeight: active ? 700 : 400, border: `1px solid ${active ? "#111" : "#e0e0e0"}`, backgroundColor: active ? "#111" : "#fff", color: active ? "#fff" : "#555", cursor: "pointer" }}>
                  {size}
                </button>
              );
            })}
          </div>

          {error && (
            <p style={{ marginBottom: 20, padding: "12px 16px", backgroundColor: "#fff5f5", border: "1px solid #fecaca", color: "#dc2626", fontSize: 13 }}>
              {error}
            </p>
          )}

          <div style={{ display: "flex", gap: 12 }}>
            <button type="submit" disabled={loading}
              style={{ flex: 1, padding: "13px 0", fontSize: 11, fontWeight: 700, letterSpacing: "0.18em", textTransform: "uppercase", backgroundColor: loading ? "#888" : "#111", color: "#fff", border: "none", cursor: loading ? "not-allowed" : "pointer" }}>
              {loading ? "Guardando..." : "Guardar producto"}
            </button>
            <button type="button" onClick={onClose}
              style={{ padding: "13px 20px", fontSize: 11, letterSpacing: "0.1em", textTransform: "uppercase", backgroundColor: "transparent", color: "#888", border: "1px solid #e0e0e0", cursor: "pointer" }}>
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}