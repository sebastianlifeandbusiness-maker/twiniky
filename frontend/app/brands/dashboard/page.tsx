"use client";

import { useState, useEffect, FormEvent } from "react";
import { useRouter } from "next/navigation";
import {
  brandsApi,
  BrandProductPayload,
  BrandOrderOut,
  BrandStats,
  ProductStockAlert,
} from "@/lib/api";
import { useBrandStore } from "@/lib/store/brand";
import { formatCLP } from "@/lib/utils/format";
import type { Product } from "@/types";

/* ─── constants ─────────────────────────────────────────────────────────── */

const CATEGORIES = ["Tops", "Pantalones", "Vestidos", "Chaquetas", "Zapatos", "Accesorios"];
const ALL_SIZES = ["XS", "S", "M", "L", "XL", "XXL", "35", "36", "37", "38", "39", "40", "41", "42", "Unico"];

const EMPTY_PRODUCT: BrandProductPayload = {
  name: "", description: "", price: 0, category: "",
  sizes: [], color: undefined, occasions: [], image_url: "", stock: 0,
};

const BRAND_COLORS = [
  { label: "Negro",    value: "negro",    hex: "#1a1a1a" },
  { label: "Blanco",   value: "blanco",   hex: "#f0f0f0" },
  { label: "Azul",     value: "azul",     hex: "#2563eb" },
  { label: "Rojo",     value: "rojo",     hex: "#dc2626" },
  { label: "Verde",    value: "verde",    hex: "#16a34a" },
  { label: "Amarillo", value: "amarillo", hex: "#eab308" },
  { label: "Rosado",   value: "rosado",   hex: "#f472b6" },
  { label: "Gris",     value: "gris",     hex: "#9ca3af" },
  { label: "Cafe",     value: "cafe",     hex: "#92400e" },
  { label: "Beige",    value: "beige",    hex: "#d4b896" },
];

const BRAND_OCCASIONS = ["Casual", "Oficina", "Fiesta", "Deporte"];

type Section = "catalog" | "orders" | "stats" | "stock_alerts" | "tryon" | "profile" | "settings";

const SIDEBAR_ITEMS: { id: Section; label: string; icon: React.ReactNode }[] = [
  { id: "catalog",      label: "Catalogo",       icon: <BoxIcon /> },
  { id: "orders",       label: "Pedidos",         icon: <ClipboardIcon /> },
  { id: "stats",        label: "Estadisticas",    icon: <ChartIcon /> },
  { id: "stock_alerts", label: "Alertas de stock",icon: <BellIcon /> },
  { id: "tryon",        label: "Probador 3D",     icon: <HangerIcon /> },
  { id: "profile",      label: "Perfil de marca", icon: <StoreIcon /> },
  { id: "settings",     label: "Configuracion",   icon: <GearIcon /> },
];

/* ─── main page ─────────────────────────────────────────────────────────── */

export default function BrandDashboardPage() {
  const router = useRouter();
  const { brand, token, clearBrand, setBrand } = useBrandStore();
  const [mounted, setMounted] = useState(false);
  const [section, setSection] = useState<Section>("catalog");

  // Catalog
  const [products, setProducts] = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);

  // Orders
  const [orders, setOrders] = useState<BrandOrderOut[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);

  // Stats
  const [stats, setStats] = useState<BrandStats | null>(null);
  const [loadingStats, setLoadingStats] = useState(false);

  // Stock alerts
  const [stockAlerts, setStockAlerts] = useState<ProductStockAlert[]>([]);
  const [loadingStockAlerts, setLoadingStockAlerts] = useState(false);

  // Profile form
  const [profileForm, setProfileForm] = useState({ name: "", description: "", logo_url: "" });
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileMsg, setProfileMsg] = useState<{ ok: boolean; text: string } | null>(null);

  // Settings form
  const [settingsForm, setSettingsForm] = useState({
    email: "", current_password: "", new_password: "", confirm_password: "",
  });
  const [settingsSaving, setSettingsSaving] = useState(false);
  const [settingsMsg, setSettingsMsg] = useState<{ ok: boolean; text: string } | null>(null);

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    if (mounted && !token) router.replace("/brands/login");
  }, [mounted, token, router]);

  useEffect(() => {
    if (brand) {
      setProfileForm({ name: brand.name ?? "", description: brand.description ?? "", logo_url: brand.logo_url ?? "" });
      setSettingsForm((prev) => ({ ...prev, email: brand.email ?? "" }));
    }
  }, [brand]);

  useEffect(() => {
    if (brand && token) { fetchProducts(); fetchOrders(); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [brand, token]);

  useEffect(() => {
    if (!token) return;
    if (section === "stats" && !stats && !loadingStats) fetchStats();
    if (section === "stock_alerts" && stockAlerts.length === 0 && !loadingStockAlerts) fetchStockAlerts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [section]);

  async function fetchProducts() {
    if (!brand) return;
    setLoadingProducts(true);
    try { const { data } = await brandsApi.getProducts(brand.id); setProducts(data); }
    catch { /* ignore */ } finally { setLoadingProducts(false); }
  }

  async function fetchOrders() {
    if (!brand) return;
    setLoadingOrders(true);
    try { const { data } = await brandsApi.getOrders(brand.id); setOrders(data); }
    catch { /* ignore */ } finally { setLoadingOrders(false); }
  }

  async function fetchStats() {
    setLoadingStats(true);
    try { const { data } = await brandsApi.getStats(); setStats(data); }
    catch { /* ignore */ } finally { setLoadingStats(false); }
  }

  async function fetchStockAlerts() {
    setLoadingStockAlerts(true);
    try { const { data } = await brandsApi.getStockAlerts(); setStockAlerts(data); }
    catch { /* ignore */ } finally { setLoadingStockAlerts(false); }
  }

  async function handleSaveProfile(e: FormEvent) {
    e.preventDefault();
    setProfileSaving(true);
    setProfileMsg(null);
    try {
      const { data } = await brandsApi.updateProfile({
        name: profileForm.name || undefined,
        description: profileForm.description || undefined,
        logo_url: profileForm.logo_url || undefined,
      });
      setBrand(data);
      setProfileMsg({ ok: true, text: "Perfil actualizado correctamente." });
    } catch {
      setProfileMsg({ ok: false, text: "No se pudo guardar. Intenta de nuevo." });
    } finally {
      setProfileSaving(false);
    }
  }

  async function handleSaveCredentials(e: FormEvent) {
    e.preventDefault();
    setSettingsMsg(null);
    if (settingsForm.new_password && settingsForm.new_password !== settingsForm.confirm_password) {
      setSettingsMsg({ ok: false, text: "Las contrasenas nuevas no coinciden." });
      return;
    }
    if (!settingsForm.current_password) {
      setSettingsMsg({ ok: false, text: "Ingresa tu contrasena actual para confirmar." });
      return;
    }
    setSettingsSaving(true);
    try {
      const { data } = await brandsApi.updateCredentials({
        email: settingsForm.email || undefined,
        current_password: settingsForm.current_password,
        new_password: settingsForm.new_password || undefined,
      });
      setBrand(data);
      setSettingsForm((prev) => ({ ...prev, current_password: "", new_password: "", confirm_password: "" }));
      setSettingsMsg({ ok: true, text: "Credenciales actualizadas correctamente." });
    } catch (err: unknown) {
      const detail = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
      setSettingsMsg({ ok: false, text: detail ?? "No se pudo actualizar. Intenta de nuevo." });
    } finally {
      setSettingsSaving(false);
    }
  }

  if (!mounted || !brand || !token) return null;

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh", backgroundColor: "#fff" }}>

      {/* ── Top bar ── */}
      <header
        style={{
          borderBottom: "1px solid #ebebeb",
          padding: "0 32px",
          height: 56,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexShrink: 0,
          backgroundColor: "#fff",
          zIndex: 10,
        }}
      >
        <span style={{ fontSize: 16, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "#111" }}>
          {brand.name}
        </span>
        <div />
      </header>

      {/* ── Body: sidebar + content ── */}
      <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>

        {/* Sidebar */}
        <nav
          style={{
            width: 220,
            backgroundColor: "#FAFAF8",
            borderRight: "1px solid #EBEBEB",
            overflowY: "auto",
            flexShrink: 0,
            paddingTop: 16,
            paddingBottom: 24,
          }}
        >
          {SIDEBAR_ITEMS.map(({ id, label, icon }) => {
            const active = section === id;
            return (
              <button
                key={id}
                onClick={() => id === "tryon" ? router.push("/tryon") : setSection(id)}
                style={{
                  width: "100%",
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "11px 20px",
                  fontSize: 12,
                  fontWeight: active ? 600 : 400,
                  letterSpacing: "0.02em",
                  border: "none",
                  backgroundColor: active ? "#111" : "transparent",
                  color: active ? "#fff" : "#444",
                  cursor: "pointer",
                  textAlign: "left",
                  transition: "background-color 0.12s, color 0.12s",
                }}
                onMouseEnter={(e) => { if (!active) (e.currentTarget as HTMLButtonElement).style.backgroundColor = "#F0EEE9"; }}
                onMouseLeave={(e) => { if (!active) (e.currentTarget as HTMLButtonElement).style.backgroundColor = "transparent"; }}
              >
                <span style={{ opacity: active ? 1 : 0.6, flexShrink: 0 }}>{icon}</span>
                {label}
              </button>
            );
          })}
        </nav>

        {/* Content */}
        <main style={{ flex: 1, overflowY: "auto", padding: "32px 40px 64px" }}>

          {/* CATALOGO */}
          {section === "catalog" && (
            <>
              <SectionHeader title={`Catalogo (${products.length})`}>
                <button
                  onClick={() => setShowAddForm(true)}
                  style={{
                    fontSize: 10, fontWeight: 700, letterSpacing: "0.18em", textTransform: "uppercase",
                    backgroundColor: "#111", color: "#fff", border: "none",
                    padding: "9px 18px", cursor: "pointer",
                  }}
                >
                  + Agregar producto
                </button>
              </SectionHeader>

              {loadingProducts ? (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "40px 20px" }}>
                  {Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)}
                </div>
              ) : products.length === 0 ? (
                <EmptyState
                  message="Aun no tienes productos"
                  sub="Agrega tu primer producto para aparecer en el catalogo de Twiniky"
                  action={{ label: "Agregar primer producto", onClick: () => setShowAddForm(true) }}
                />
              ) : (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "40px 20px" }}>
                  {products.map((p) => <DashboardProductCard key={p.id} product={p} />)}
                </div>
              )}
            </>
          )}

          {/* PEDIDOS */}
          {section === "orders" && (
            <>
              <SectionHeader title={`Pedidos (${orders.length})`} />

              {loadingOrders ? (
                <div>
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} style={{ borderBottom: "1px solid #ebebeb", padding: "20px 0" }}>
                      <div className="tw-skeleton" style={{ height: 11, width: "30%", marginBottom: 8 }} />
                      <div className="tw-skeleton" style={{ height: 11, width: "60%" }} />
                    </div>
                  ))}
                </div>
              ) : orders.length === 0 ? (
                <EmptyState message="Aun no tienes pedidos" sub="Los pedidos de tus productos apareceran aqui" />
              ) : (
                <div>
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "2fr 1fr 1fr 1fr 2fr 1fr",
                      gap: "0 16px",
                      padding: "0 0 10px",
                      borderBottom: "1px solid #111",
                      marginBottom: 4,
                    }}
                  >
                    {["Producto", "Cant.", "Talla", "Total", "Direccion", "Estado"].map((h) => (
                      <p key={h} style={{ margin: 0, fontSize: 9, fontWeight: 700, letterSpacing: "0.18em", textTransform: "uppercase", color: "#888" }}>
                        {h}
                      </p>
                    ))}
                  </div>
                  {orders.map((o) => <OrderRow key={o.id} order={o} />)}
                </div>
              )}
            </>
          )}

          {/* ESTADISTICAS */}
          {section === "stats" && (
            <>
              <SectionHeader title="Estadisticas" />

              {loadingStats ? (
                <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
                  <div style={{ display: "flex", gap: 16 }}>
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="tw-skeleton" style={{ height: 72, flex: 1 }} />
                    ))}
                  </div>
                  <div className="tw-skeleton" style={{ height: 160, width: "100%" }} />
                </div>
              ) : !stats ? (
                <EmptyState message="No se pudieron cargar las estadisticas" sub="" action={{ label: "Reintentar", onClick: fetchStats }} />
              ) : (
                <>
                  <div style={{ display: "flex", gap: 16, marginBottom: 36, flexWrap: "wrap" }}>
                    <StatBox label="Total pedidos" value={String(stats.total_orders)} />
                    <StatBox label="Ingresos totales" value={formatCLP(stats.total_revenue)} />
                    <StatBox label="Productos" value={String(stats.total_products)} />
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 32, flexWrap: "wrap" }}>
                    {/* Top productos */}
                    <div style={{ border: "1px solid #ebebeb", padding: "20px 24px" }}>
                      <p style={{ margin: "0 0 16px", fontSize: 9, fontWeight: 700, letterSpacing: "0.18em", textTransform: "uppercase", color: "#aaa" }}>
                        Top productos
                      </p>
                      {stats.top_products.length === 0 ? (
                        <p style={{ margin: 0, fontSize: 12, color: "#ccc" }}>Sin datos</p>
                      ) : (
                        stats.top_products.map((p, i) => (
                          <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: i < stats.top_products.length - 1 ? "1px solid #f0f0f0" : "none" }}>
                            <p style={{ margin: 0, fontSize: 12, color: "#333" }}>{p.name}</p>
                            <p style={{ margin: 0, fontSize: 12, fontWeight: 600, color: "#111" }}>{p.quantity} uds</p>
                          </div>
                        ))
                      )}
                    </div>

                    {/* Grafico ventas por mes */}
                    <div style={{ border: "1px solid #ebebeb", padding: "20px 24px" }}>
                      <p style={{ margin: "0 0 20px", fontSize: 9, fontWeight: 700, letterSpacing: "0.18em", textTransform: "uppercase", color: "#aaa" }}>
                        Ventas por mes (CLP)
                      </p>
                      <SalesBarChart data={stats.sales_by_month} />
                    </div>
                  </div>
                </>
              )}
            </>
          )}

          {/* ALERTAS DE STOCK */}
          {section === "stock_alerts" && (
            <>
              <SectionHeader title="Alertas de stock" />

              {loadingStockAlerts ? (
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {[1, 2, 3].map((i) => <div key={i} className="tw-skeleton" style={{ height: 80 }} />)}
                </div>
              ) : stockAlerts.length === 0 ? (
                <EmptyState
                  message="Sin alertas activas"
                  sub="Cuando compradores activen alertas de stock en tus productos apareceran aqui"
                />
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {stockAlerts.map((item) => (
                    <div
                      key={item.product_id}
                      style={{
                        display: "flex",
                        alignItems: "flex-start",
                        gap: 16,
                        padding: "16px 20px",
                        border: "1px solid #ebebeb",
                        backgroundColor: "#fafaf8",
                      }}
                    >
                      {item.product_image && (
                        <img
                          src={item.product_image}
                          alt={item.product_name}
                          style={{ width: 48, height: 48, objectFit: "cover", flexShrink: 0, border: "1px solid #ebebeb" }}
                        />
                      )}
                      <div style={{ flex: 1 }}>
                        <p style={{ margin: "0 0 6px", fontSize: 13, fontWeight: 600, color: "#111" }}>
                          {item.product_name}
                        </p>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                          {item.sizes_waiting.map(({ size, count }) => (
                            <span
                              key={size}
                              style={{
                                padding: "3px 8px",
                                fontSize: 10,
                                fontWeight: 600,
                                border: "1px solid #e0e0e0",
                                color: "#555",
                                backgroundColor: "#fff",
                              }}
                            >
                              Talla {size} — {count} {count === 1 ? "persona" : "personas"}
                            </span>
                          ))}
                        </div>
                      </div>
                      <div style={{ flexShrink: 0, textAlign: "right" }}>
                        <p style={{ margin: 0, fontSize: 20, fontWeight: 300, color: "#111" }}>{item.total_waiting}</p>
                        <p style={{ margin: 0, fontSize: 9, color: "#aaa", textTransform: "uppercase", letterSpacing: "0.1em" }}>esperando</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {/* PROBADOR 3D */}
          {section === "tryon" && (
            <>
              <SectionHeader title="Probador 3D" />
              <div
                style={{
                  padding: "48px 32px",
                  border: "1px solid #ebebeb",
                  backgroundColor: "#fafaf8",
                  textAlign: "center",
                  maxWidth: 480,
                }}
              >
                <div style={{ marginBottom: 20 }}>
                  <HangerIconLarge />
                </div>
                <p style={{ margin: "0 0 8px", fontSize: 15, fontWeight: 300, color: "#111" }}>
                  Probador Virtual 3D
                </p>
                <p style={{ margin: "0 0 28px", fontSize: 12, color: "#aaa", lineHeight: 1.6 }}>
                  Visualiza como se ven tus prendas en el maniqui 3D antes de publicarlas.
                </p>
                <button
                  onClick={() => router.push("/tryon")}
                  style={{
                    padding: "12px 32px",
                    fontSize: 11,
                    fontWeight: 700,
                    letterSpacing: "0.18em",
                    textTransform: "uppercase",
                    backgroundColor: "#111",
                    color: "#fff",
                    border: "none",
                    cursor: "pointer",
                  }}
                >
                  Abrir probador
                </button>
              </div>
            </>
          )}

          {/* PERFIL DE MARCA */}
          {section === "profile" && (
            <>
              <SectionHeader title="Perfil de marca" />
              <form onSubmit={handleSaveProfile} style={{ maxWidth: 480, display: "flex", flexDirection: "column", gap: 20 }}>
                <Field label="Nombre de la marca">
                  <input
                    type="text"
                    value={profileForm.name}
                    onChange={(e) => setProfileForm((p) => ({ ...p, name: e.target.value }))}
                    style={inputStyle}
                  />
                </Field>
                <Field label="Descripcion">
                  <textarea
                    value={profileForm.description}
                    onChange={(e) => setProfileForm((p) => ({ ...p, description: e.target.value }))}
                    rows={3}
                    style={{ ...inputStyle, resize: "vertical" }}
                  />
                </Field>
                <Field label="URL del logo">
                  <input
                    type="text"
                    value={profileForm.logo_url}
                    onChange={(e) => setProfileForm((p) => ({ ...p, logo_url: e.target.value }))}
                    placeholder="https://..."
                    style={inputStyle}
                  />
                  {profileForm.logo_url && (
                    <img
                      src={profileForm.logo_url}
                      alt="Preview logo"
                      style={{ marginTop: 8, height: 40, objectFit: "contain", border: "1px solid #ebebeb" }}
                    />
                  )}
                </Field>
                {profileMsg && (
                  <p style={{ margin: 0, fontSize: 12, color: profileMsg.ok ? "#16a34a" : "#dc2626" }}>
                    {profileMsg.text}
                  </p>
                )}
                <button
                  type="submit"
                  disabled={profileSaving}
                  style={submitBtnStyle(profileSaving)}
                >
                  {profileSaving ? "Guardando..." : "Guardar cambios"}
                </button>
              </form>
            </>
          )}

          {/* CONFIGURACION */}
          {section === "settings" && (
            <>
              <SectionHeader title="Configuracion de cuenta" />
              <form onSubmit={handleSaveCredentials} style={{ maxWidth: 480, display: "flex", flexDirection: "column", gap: 20 }}>
                <Field label="Email de la cuenta">
                  <input
                    type="email"
                    value={settingsForm.email}
                    onChange={(e) => setSettingsForm((p) => ({ ...p, email: e.target.value }))}
                    style={inputStyle}
                  />
                </Field>
                <Field label="Contrasena actual *">
                  <input
                    type="password"
                    value={settingsForm.current_password}
                    onChange={(e) => setSettingsForm((p) => ({ ...p, current_password: e.target.value }))}
                    placeholder="Requerida para guardar cualquier cambio"
                    style={inputStyle}
                    required
                  />
                </Field>
                <Field label="Nueva contrasena (opcional)">
                  <input
                    type="password"
                    value={settingsForm.new_password}
                    onChange={(e) => setSettingsForm((p) => ({ ...p, new_password: e.target.value }))}
                    placeholder="Dejar vacio para no cambiar"
                    style={inputStyle}
                    minLength={8}
                  />
                </Field>
                {settingsForm.new_password && (
                  <Field label="Confirmar nueva contrasena">
                    <input
                      type="password"
                      value={settingsForm.confirm_password}
                      onChange={(e) => setSettingsForm((p) => ({ ...p, confirm_password: e.target.value }))}
                      style={inputStyle}
                    />
                  </Field>
                )}
                {settingsMsg && (
                  <p style={{ margin: 0, fontSize: 12, color: settingsMsg.ok ? "#16a34a" : "#dc2626" }}>
                    {settingsMsg.text}
                  </p>
                )}
                <button
                  type="submit"
                  disabled={settingsSaving}
                  style={submitBtnStyle(settingsSaving)}
                >
                  {settingsSaving ? "Guardando..." : "Guardar cambios"}
                </button>
              </form>
            </>
          )}
        </main>
      </div>

      {showAddForm && (
        <AddProductModal
          brandId={brand.id}
          onClose={() => setShowAddForm(false)}
          onCreated={(p) => { setProducts((prev) => [p, ...prev]); setShowAddForm(false); }}
        />
      )}
    </div>
  );
}

/* ─── inline style helpers ───────────────────────────────────────────────── */

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "10px 12px",
  fontSize: 13,
  color: "#111",
  border: "1px solid #e0e0e0",
  outline: "none",
  boxSizing: "border-box",
  fontFamily: "inherit",
};

const submitBtnStyle = (disabled: boolean): React.CSSProperties => ({
  padding: "12px 0",
  fontSize: 11,
  fontWeight: 700,
  letterSpacing: "0.18em",
  textTransform: "uppercase",
  backgroundColor: disabled ? "#888" : "#111",
  color: "#fff",
  border: "none",
  cursor: disabled ? "not-allowed" : "pointer",
});

/* ─── small shared components ────────────────────────────────────────────── */

function SectionHeader({ title, children }: { title: string; children?: React.ReactNode }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
      <h2 style={{ margin: 0, fontSize: 10, fontWeight: 700, letterSpacing: "0.22em", textTransform: "uppercase", color: "#aaa" }}>
        {title}
      </h2>
      {children}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label style={{ display: "block", fontSize: 9, fontWeight: 700, letterSpacing: "0.18em", textTransform: "uppercase", color: "#888", marginBottom: 6 }}>
        {label}
      </label>
      {children}
    </div>
  );
}

function StatBox({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ border: "1px solid #ebebeb", padding: "16px 24px", minWidth: 140 }}>
      <p style={{ margin: "0 0 4px", fontSize: 9, fontWeight: 700, letterSpacing: "0.2em", textTransform: "uppercase", color: "#aaa" }}>
        {label}
      </p>
      <p style={{ margin: 0, fontSize: 22, fontWeight: 500, color: "#111" }}>{value}</p>
    </div>
  );
}

function EmptyState({
  message, sub, action,
}: { message: string; sub: string; action?: { label: string; onClick: () => void } }) {
  return (
    <div style={{ padding: "60px 0", textAlign: "center", border: "1px dashed #e0e0e0" }}>
      <p style={{ fontSize: 15, fontWeight: 300, color: "#ccc", margin: "0 0 12px" }}>{message}</p>
      {sub && <p style={{ fontSize: 13, color: "#aaa", margin: "0 0 24px" }}>{sub}</p>}
      {action && (
        <button
          onClick={action.onClick}
          style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.2em", textTransform: "uppercase", background: "none", border: "none", color: "#888", cursor: "pointer", textDecoration: "underline", textUnderlineOffset: 3 }}
        >
          {action.label}
        </button>
      )}
    </div>
  );
}

function SalesBarChart({ data }: { data: { month: string; total: number }[] }) {
  const max = Math.max(...data.map((d) => d.total), 1);
  return (
    <div style={{ display: "flex", alignItems: "flex-end", gap: 8, height: 100 }}>
      {data.map((d) => (
        <div key={d.month} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6, flex: 1 }}>
          <p style={{ margin: 0, fontSize: 9, color: "#bbb", textAlign: "center", letterSpacing: "0.02em" }}>
            {d.total > 0 ? formatCLP(d.total) : ""}
          </p>
          <div
            style={{
              width: "100%",
              backgroundColor: d.total > 0 ? "#111" : "#f0efec",
              height: d.total > 0 ? `${Math.max((d.total / max) * 72, 4)}px` : "4px",
              transition: "height 0.3s ease",
            }}
          />
          <span style={{ fontSize: 9, color: "#aaa", letterSpacing: "0.03em", whiteSpace: "nowrap" }}>{d.month}</span>
        </div>
      ))}
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
      <p style={{ margin: 0, fontSize: 10, color: "#aaa" }}>Stock: {product.stock} · {product.sizes.join(", ") || "Sin tallas"}</p>
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

const STATUS_LABELS: Record<string, string> = {
  pending: "Pendiente", paid: "Pagado", shipped: "Enviado",
  delivered: "Entregado", cancelled: "Cancelado",
};
const STATUS_COLORS: Record<string, { bg: string; color: string }> = {
  pending: { bg: "#fef9c3", color: "#854d0e" },
  paid: { bg: "#dcfce7", color: "#166534" },
  shipped: { bg: "#dbeafe", color: "#1e40af" },
  delivered: { bg: "#d1fae5", color: "#065f46" },
  cancelled: { bg: "#fee2e2", color: "#991b1b" },
};

function parseShipping(raw: string | null): string {
  if (!raw) return "—";
  try {
    const obj = JSON.parse(raw);
    return [obj.fullName, obj.address, obj.city, obj.region].filter(Boolean).join(", ") || raw;
  } catch { return raw; }
}

function OrderRow({ order }: { order: BrandOrderOut }) {
  const badge = STATUS_COLORS[order.status] ?? { bg: "#f3f4f6", color: "#374151" };
  const date = new Date(order.created_at).toLocaleDateString("es-CL", { day: "2-digit", month: "short", year: "numeric" });
  return (
    <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr 2fr 1fr", gap: "0 16px", padding: "16px 0", borderBottom: "1px solid #f0f0f0", alignItems: "start" }}>
      <div>
        <p style={{ margin: "0 0 2px", fontSize: 13, color: "#111" }}>{order.product_name}</p>
        <p style={{ margin: 0, fontSize: 10, color: "#bbb" }}>{date}</p>
      </div>
      <p style={{ margin: 0, fontSize: 13, color: "#555" }}>{order.quantity}</p>
      <p style={{ margin: 0, fontSize: 13, color: "#555" }}>{order.size ?? "—"}</p>
      <p style={{ margin: 0, fontSize: 13, fontWeight: 500, color: "#111" }}>{formatCLP(order.total_price)}</p>
      <p style={{ margin: 0, fontSize: 11, color: "#777", lineHeight: 1.5 }}>{parseShipping(order.shipping_address)}</p>
      <span style={{ display: "inline-block", padding: "3px 8px", fontSize: 9, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", backgroundColor: badge.bg, color: badge.color, borderRadius: 2, whiteSpace: "nowrap" }}>
        {STATUS_LABELS[order.status] ?? order.status}
      </span>
    </div>
  );
}

/* ─── AddProductModal ────────────────────────────────────────────────────── */

function AddProductModal({ brandId, onClose, onCreated }: { brandId: string; onClose: () => void; onCreated: (p: Product) => void }) {
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

  function toggleOccasion(occ: string) {
    setForm((prev) => ({
      ...prev,
      occasions: (prev.occasions ?? []).includes(occ)
        ? (prev.occasions ?? []).filter((o) => o !== occ)
        : [...(prev.occasions ?? []), occ],
    }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (!form.name.trim() || !form.category || !form.price) {
      setError("Nombre, categoria y precio son obligatorios.");
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
        color: form.color || undefined,
        occasions: form.occasions?.length ? form.occasions : undefined,
      });
      onCreated(data);
    } catch (err: unknown) {
      const detail = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
      setError(detail ?? "No se pudo crear el producto.");
    } finally {
      setLoading(false);
    }
  }

  const labelStyle: React.CSSProperties = { display: "block", fontSize: 9, fontWeight: 700, letterSpacing: "0.18em", textTransform: "uppercase", color: "#888", marginBottom: 6 };

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
            style={{ ...inputStyle, marginBottom: 16 }} />

          <label style={labelStyle}>Categoria *</label>
          <select value={form.category} onChange={setField("category")}
            style={{ ...inputStyle, color: form.category ? "#111" : "#aaa", backgroundColor: "#fff", cursor: "pointer", marginBottom: 16 }}>
            <option value="">Selecciona una categoria</option>
            {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
            <div>
              <label style={labelStyle}>Precio CLP *</label>
              <input type="number" value={String(form.price || "")} onChange={setField("price")} placeholder="29990"
                style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Stock</label>
              <input type="number" value={String(form.stock || "")} onChange={setField("stock")} placeholder="10"
                style={inputStyle} />
            </div>
          </div>

          <label style={labelStyle}>Descripcion</label>
          <textarea value={form.description} onChange={setField("description")} placeholder="Describe la prenda..." rows={3}
            style={{ ...inputStyle, resize: "vertical", marginBottom: 16 }} />

          <label style={labelStyle}>URL de imagen</label>
          <input type="text" value={form.image_url ?? ""} onChange={setField("image_url")} placeholder="https://..."
            style={{ ...inputStyle, marginBottom: 20 }} />

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

          <label style={labelStyle}>Color principal</label>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginTop: 8, marginBottom: 20 }}>
            {BRAND_COLORS.map(({ label, value, hex }) => {
              const active = form.color === value;
              return (
                <button key={value} type="button" title={label}
                  onClick={() => setForm((prev) => ({ ...prev, color: active ? undefined : value }))}
                  style={{ width: 32, height: 32, borderRadius: "50%", backgroundColor: hex, cursor: "pointer", border: active ? "3px solid #111" : "2px solid #e0e0e0", outline: active ? "2px solid #fff" : "none", outlineOffset: -4, boxSizing: "border-box" }}
                />
              );
            })}
          </div>

          <label style={labelStyle}>Ocasion</label>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 8, marginBottom: 20 }}>
            {BRAND_OCCASIONS.map((occ) => {
              const active = (form.occasions ?? []).includes(occ);
              return (
                <button key={occ} type="button" onClick={() => toggleOccasion(occ)}
                  style={{ padding: "6px 14px", fontSize: 11, fontWeight: active ? 700 : 400, border: `1px solid ${active ? "#111" : "#e0e0e0"}`, backgroundColor: active ? "#111" : "#fff", color: active ? "#fff" : "#555", cursor: "pointer" }}>
                  {occ}
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
            <button type="submit" disabled={loading} style={{ ...submitBtnStyle(loading), flex: 1, padding: "13px 0" }}>
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

/* ─── SVG icons ──────────────────────────────────────────────────────────── */

function BoxIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
      <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
      <line x1="12" y1="22.08" x2="12" y2="12" />
    </svg>
  );
}

function ClipboardIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
      <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
    </svg>
  );
}

function ChartIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="20" x2="18" y2="10" />
      <line x1="12" y1="20" x2="12" y2="4" />
      <line x1="6" y1="20" x2="6" y2="14" />
    </svg>
  );
}

function BellIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
  );
}

function HangerIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="4" r="2.2" />
      <path d="M9 8h6l1 6H8L9 8z" />
      <path d="M9 14l-2 6" />
      <path d="M15 14l2 6" />
    </svg>
  );
}

function HangerIconLarge() {
  return (
    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#ccc" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="4" r="2.2" />
      <path d="M9 8h6l1 6H8L9 8z" />
      <path d="M9 14l-2 6" />
      <path d="M15 14l2 6" />
    </svg>
  );
}

function StoreIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  );
}

function GearIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  );
}
