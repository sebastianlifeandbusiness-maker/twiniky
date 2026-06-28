"use client";

import { use, useState, type FormEvent } from "react";
import Link from "next/link";
import { useProduct } from "@/lib/hooks/useProducts";
import { useCartStore } from "@/lib/store/cart";
import { useBrandStore } from "@/lib/store/brand";
import { useAuthStore } from "@/lib/store/auth";
import { useFavoritesStore } from "@/lib/store/favorites";
import { useAlertsStore } from "@/lib/store/alerts";
import { favoritesApi, stockAlertsApi } from "@/lib/api";
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
  const [favLoading, setFavLoading] = useState(false);
  const [alertStatus, setAlertStatus] = useState<"idle" | "loading" | "success" | "conflict" | "error">("idle");
  const [activeAlertId, setActiveAlertId] = useState<string | null>(null);
  const [showGuestForm, setShowGuestForm] = useState(false);
  const [guestEmail, setGuestEmail] = useState("");
  const [guestStatus, setGuestStatus] = useState<"idle" | "loading" | "success" | "conflict" | "error">("idle");
  const router = useRouter();
  const addItem = useCartStore((s) => s.addItem);
  const { brand: activeBrand, token: brandToken } = useBrandStore();
  const { token } = useAuthStore();
  const { ids: favIds, add: favAdd, remove: favRemove } = useFavoritesStore();
  const { increment: alertIncrement, decrement: alertDecrement } = useAlertsStore();

  async function handleFavorite() {
    if (!product) return;
    if (!token) { router.push("/login"); return; }
    if (favLoading) return;
    const isFav = favIds.includes(product.id);
    setFavLoading(true);
    try {
      if (isFav) { await favoritesApi.remove(product.id); favRemove(product.id); }
      else { await favoritesApi.add(product.id); favAdd(product.id); }
    } catch { /* mantiene estado anterior */ }
    finally { setFavLoading(false); }
  }

  async function handleGuestSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!product || !guestEmail.trim()) return;
    const size = selectedSize ?? (product.sizes.length === 0 ? "Unica" : null);
    if (!size) return;
    setGuestStatus("loading");
    try {
      await stockAlertsApi.createGuest(guestEmail.trim(), product.id, size);
      setGuestStatus("success");
    } catch (err: unknown) {
      const s = (err as { response?: { status?: number } })?.response?.status;
      setGuestStatus(s === 409 ? "conflict" : "error");
    }
  }

  async function handleNotifyMe() {
    if (!product) return;
    if (!token) {
      setShowGuestForm(true);
      return;
    }
    const size = selectedSize ?? (product.sizes.length === 0 ? "Unica" : null);
    if (!size) return;
    setAlertStatus("loading");
    try {
      const { data } = await stockAlertsApi.create(product.id, size);
      setActiveAlertId(data.id);
      setAlertStatus("success");
      alertIncrement();
    } catch (err: unknown) {
      const status = (err as { response?: { status?: number; data?: { detail?: { alert_id?: string } } } })?.response?.status;
      const detail = (err as { response?: { data?: { detail?: { alert_id?: string } } } })?.response?.data?.detail;
      if (status === 409) {
        setActiveAlertId(detail?.alert_id ?? null);
        setAlertStatus("conflict");
      } else {
        setAlertStatus("error");
      }
    }
  }

  async function handleCancelAlert() {
    if (!activeAlertId) return;
    try {
      await stockAlertsApi.delete(activeAlertId);
      setAlertStatus("idle");
      setActiveAlertId(null);
      alertDecrement();
    } catch { /* sin cambio */ }
  }

  function handleAddToCart() {
    if (!product) return;
    if (activeBrand) {
      setBlockMsg("No disponible en modo marca");
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

          {/* Name + favorito */}
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, marginBottom: 14 }}>
            <h1 style={{ margin: 0, fontSize: 24, fontWeight: 300, color: "#111", lineHeight: 1.3 }}>
              {product.name}
            </h1>
            {!brandToken && (
              <button
                onClick={handleFavorite}
                title={favIds.includes(product.id) ? "Quitar de favoritos" : "Agregar a favoritos"}
                style={{ flexShrink: 0, width: 36, height: 36, borderRadius: "50%", border: "1px solid #e8e8e8", backgroundColor: "#fff", cursor: favLoading ? "wait" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", padding: 0 }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill={favIds.includes(product.id) ? "#e11d48" : "none"} stroke={favIds.includes(product.id) ? "#e11d48" : "#888"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                </svg>
              </button>
            )}
          </div>

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
                    onClick={() => {
                      setSelectedSize(size === selectedSize ? null : size);
                      setShowGuestForm(false);
                      setGuestStatus("idle");
                      setAlertStatus("idle");
                    }}
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

            {/* Sin talla → siempre "Selecciona una talla" aunque el stock sea 0 */}
            {product.sizes.length > 0 && !selectedSize ? (
              <AddToCartBtn needsSize={true} added={false} blocked={false} onClick={() => {}} />
            ) : product.stock === 0 ? (
              <>
                <BellBtn
                  status={alertStatus}
                  selectedSize={selectedSize}
                  onNotify={handleNotifyMe}
                  onCancel={handleCancelAlert}
                />

                {/* Feedback usuario registrado */}
                {alertStatus === "success" && token && (
                  <p style={{ margin: 0, fontSize: 11, color: "#16a34a", textAlign: "center", letterSpacing: "0.03em" }}>
                    Te avisaremos cuando vuelva a estar disponible en talla {selectedSize ?? "Unica"}.
                  </p>
                )}
                {alertStatus === "conflict" && token && (
                  <p style={{ margin: 0, fontSize: 11, color: "#888", textAlign: "center" }}>
                    Ya tienes una alerta activa.{" "}
                    <a href="/notifications" style={{ color: "#111", textDecoration: "underline" }}>Ver mis alertas</a>
                  </p>
                )}
                {alertStatus === "error" && token && (
                  <p style={{ margin: 0, fontSize: 11, color: "#dc2626", textAlign: "center" }}>
                    Error al guardar la alerta. Intenta de nuevo.
                  </p>
                )}

                {/* Formulario inline para invitados */}
                {showGuestForm && !token && (
                  <div style={{ border: "1px solid #e8e8e8", padding: "14px 16px", backgroundColor: "#fafafa" }}>
                    {guestStatus === "success" ? (
                      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                        <p style={{ margin: 0, fontSize: 12, color: "#16a34a", textAlign: "center" }}>
                          Listo. Te avisaremos a <strong>{guestEmail}</strong> cuando vuelva a estar disponible.
                        </p>
                        <p style={{ margin: 0, fontSize: 11, color: "#555", textAlign: "center", letterSpacing: "0.01em" }}>
                          Quieres gestionar todas tus alertas de stock?
                        </p>
                        <a
                          href={`/register?email=${encodeURIComponent(guestEmail)}`}
                          style={{
                            display: "block",
                            padding: "10px 0",
                            fontSize: 11,
                            fontWeight: 600,
                            letterSpacing: "0.08em",
                            textTransform: "uppercase",
                            backgroundColor: "#111",
                            color: "#fff",
                            border: "1px solid #111",
                            textAlign: "center",
                            textDecoration: "none",
                          }}
                        >
                          Crear cuenta gratis
                        </a>
                        <p style={{ margin: 0, fontSize: 11, color: "#aaa", textAlign: "center" }}>
                          Ya tengo cuenta?{" "}
                          <a href="/login/comprador" style={{ color: "#555", textDecoration: "underline" }}>
                            Iniciar sesion
                          </a>
                        </p>
                      </div>
                    ) : guestStatus === "conflict" ? (
                      <p style={{ margin: 0, fontSize: 12, color: "#888", textAlign: "center" }}>
                        Ya existe una alerta para ese email y esta talla.
                      </p>
                    ) : (
                      <form onSubmit={handleGuestSubmit} style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                        <p style={{ margin: 0, fontSize: 11, color: "#555", textAlign: "center", letterSpacing: "0.02em" }}>
                          Ingresa tu email y te avisamos cuando vuelva a stock
                        </p>
                        <input
                          type="email"
                          required
                          placeholder="tu@email.com"
                          value={guestEmail}
                          onChange={(e) => setGuestEmail(e.target.value)}
                          style={{
                            padding: "9px 12px",
                            fontSize: 12,
                            border: "1px solid #ddd",
                            outline: "none",
                            width: "100%",
                            boxSizing: "border-box",
                          }}
                        />
                        <button
                          type="submit"
                          disabled={guestStatus === "loading"}
                          style={{
                            padding: "10px 0",
                            fontSize: 11,
                            fontWeight: 600,
                            letterSpacing: "0.08em",
                            textTransform: "uppercase",
                            backgroundColor: "#111",
                            color: "#fff",
                            border: "1px solid #111",
                            cursor: guestStatus === "loading" ? "not-allowed" : "pointer",
                            opacity: guestStatus === "loading" ? 0.6 : 1,
                          }}
                        >
                          {guestStatus === "loading" ? "Guardando..." : "Notificarme"}
                        </button>
                        {guestStatus === "error" && (
                          <p style={{ margin: 0, fontSize: 11, color: "#dc2626", textAlign: "center" }}>
                            Error al guardar. Intenta de nuevo.
                          </p>
                        )}
                        <p style={{ margin: 0, fontSize: 11, color: "#aaa", textAlign: "center" }}>
                          Ya tienes cuenta?{" "}
                          <a href="/login/comprador" style={{ color: "#555", textDecoration: "underline" }}>Inicia sesion</a>
                        </p>
                      </form>
                    )}
                  </div>
                )}
              </>
            ) : (
              <>
                <AddToCartBtn
                  needsSize={false}
                  added={added}
                  blocked={!!activeBrand || !!blockMsg}
                  onClick={handleAddToCart}
                />
                {blockMsg && (
                  <p style={{ margin: 0, fontSize: 11, color: "#dc2626", letterSpacing: "0.03em", textAlign: "center" }}>
                    {blockMsg}
                  </p>
                )}
              </>
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
  if (blocked) label = "No disponible en modo marca";

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

function BellBtn({
  status,
  selectedSize,
  onNotify,
  onCancel,
}: {
  status: "idle" | "loading" | "success" | "conflict" | "error";
  selectedSize: string | null;
  onNotify: () => void;
  onCancel: () => void;
}) {
  const [hov, setHov] = useState(false);

  if (status === "success") {
    return (
      <button
        onClick={onCancel}
        onMouseEnter={() => setHov(true)}
        onMouseLeave={() => setHov(false)}
        style={{
          width: "100%", padding: "14px 0", fontSize: 11, fontWeight: 600,
          letterSpacing: "0.2em", textTransform: "uppercase",
          border: "1px solid #16a34a", backgroundColor: hov ? "#f0fdf4" : "#fff",
          color: "#16a34a", cursor: "pointer", transition: "all 0.2s",
          display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
        }}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>
        Alerta activa · Cancelar
      </button>
    );
  }

  const isLoading = status === "loading";
  const label = isLoading
    ? "Guardando alerta..."
    : selectedSize
    ? `Notificarme — talla ${selectedSize}`
    : "Notificarme cuando llegue";

  return (
    <button
      disabled={isLoading}
      onClick={onNotify}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        width: "100%", padding: "14px 0", fontSize: 11, fontWeight: 600,
        letterSpacing: "0.2em", textTransform: "uppercase",
        border: "1px solid #111", backgroundColor: hov && !isLoading ? "#111" : "transparent",
        color: hov && !isLoading ? "#fff" : "#111",
        cursor: isLoading ? "not-allowed" : "pointer",
        opacity: isLoading ? 0.4 : 1, transition: "all 0.2s",
        display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
      }}
    >
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
        <path d="M13.73 21a2 2 0 0 1-3.46 0" />
      </svg>
      {label}
    </button>
  );
}

function TryOnBtn({ productId }: { productId: string }) {
  const router = useRouter();
  const { token } = useAuthStore();
  const { token: brandToken } = useBrandStore();
  const [hov, setHov] = useState(false);

  function handleClick() {
    if (!token && !brandToken) {
      router.push(`/login?message=tryon`);
      return;
    }
    router.push(`/tryon?product=${productId}`);
  }

  return (
    <button
      onClick={handleClick}
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
