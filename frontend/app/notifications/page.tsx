"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/store/auth";
import { useAlertsStore } from "@/lib/store/alerts";
import { stockAlertsApi, type StockAlertOut } from "@/lib/api";
import Link from "next/link";

export default function NotificationsPage() {
  const { token } = useAuthStore();
  const { setCount } = useAlertsStore();
  const router = useRouter();
  const [alerts, setAlerts] = useState<StockAlertOut[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState<string | null>(null);

  useEffect(() => {
    if (!token) { router.push("/login"); return; }
    stockAlertsApi.list()
      .then(({ data }) => { setAlerts(data); setCount(data.length); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [token, router, setCount]);

  async function handleCancel(alertId: string) {
    setCancelling(alertId);
    try {
      await stockAlertsApi.delete(alertId);
      setAlerts((prev) => prev.filter((a) => a.id !== alertId));
      setCount(Math.max(0, alerts.length - 1));
    } catch {
      /* sin cambio visual */
    } finally {
      setCancelling(null);
    }
  }

  return (
    <div style={{ backgroundColor: "#fff", minHeight: "100vh" }}>
      <div style={{ maxWidth: 720, margin: "0 auto", padding: "48px 32px 80px" }}>

        {/* Header */}
        <div style={{ marginBottom: 40 }}>
          <p style={{ margin: "0 0 6px", fontSize: 10, textTransform: "uppercase", letterSpacing: "0.2em", color: "#aaa" }}>
            Mi cuenta
          </p>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 300, color: "#111" }}>
            Alertas de stock
          </h1>
        </div>

        {loading ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {[1, 2, 3].map((i) => (
              <div key={i} className="tw-skeleton" style={{ height: 88, borderRadius: 8 }} />
            ))}
          </div>
        ) : alerts.length === 0 ? (
          <div style={{ textAlign: "center", padding: "64px 0", color: "#bbb" }}>
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#ddd" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: 16, display: "block", margin: "0 auto 16px" }}>
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
              <path d="M13.73 21a2 2 0 0 1-3.46 0" />
            </svg>
            <p style={{ margin: "0 0 8px", fontSize: 14, fontWeight: 300 }}>
              No tienes alertas de stock activas
            </p>
            <p style={{ margin: "0 0 24px", fontSize: 12, color: "#ccc" }}>
              Cuando un producto sin stock te interese, activa la campana y te avisamos.
            </p>
            <Link
              href="/marketplace"
              style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: "0.18em", color: "#888", textDecoration: "underline", textUnderlineOffset: 3 }}
            >
              Explorar catálogo
            </Link>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 1 }}>
            {alerts.map((alert) => (
              <AlertRow key={alert.id} alert={alert} cancelling={cancelling === alert.id} onCancel={() => handleCancel(alert.id)} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function AlertRow({ alert, cancelling, onCancel }: { alert: StockAlertOut; cancelling: boolean; onCancel: () => void }) {
  const [hov, setHov] = useState(false);

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 16,
        padding: "16px 0",
        borderBottom: "1px solid #f0f0ee",
      }}
    >
      {/* Imagen */}
      <div style={{ width: 60, height: 80, flexShrink: 0, backgroundColor: "#f5f5f3", overflow: "hidden", borderRadius: 4 }}>
        {alert.product_image ? (
          <img src={alert.product_image} alt={alert.product_name ?? ""} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        ) : (
          <div style={{ width: "100%", height: "100%", backgroundColor: "#eeecea" }} />
        )}
      </div>

      {/* Info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        {alert.product_brand && (
          <p style={{ margin: "0 0 2px", fontSize: 9, textTransform: "uppercase", letterSpacing: "0.2em", color: "#aaa" }}>
            {alert.product_brand}
          </p>
        )}
        <p style={{ margin: "0 0 4px", fontSize: 13, fontWeight: 400, color: "#111", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {alert.product_name ?? "Producto eliminado"}
        </p>
        <p style={{ margin: 0, fontSize: 11, color: "#888" }}>
          Talla <strong>{alert.size}</strong>
        </p>
        <p style={{ margin: "4px 0 0", fontSize: 10, color: "#ccc" }}>
          Desde {new Date(alert.created_at).toLocaleDateString("es-CL", { day: "numeric", month: "long" })}
        </p>
      </div>

      {/* Badge estado */}
      <div style={{ flexShrink: 0, display: "flex", alignItems: "center", gap: 12 }}>
        <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.15em", textTransform: "uppercase", color: "#b45309", backgroundColor: "#fef3c7", padding: "3px 8px", borderRadius: 20 }}>
          Sin stock
        </span>

        <button
          onClick={onCancel}
          disabled={cancelling}
          onMouseEnter={() => setHov(true)}
          onMouseLeave={() => setHov(false)}
          style={{
            padding: "6px 12px",
            fontSize: 10,
            fontWeight: 600,
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            border: "1px solid #e0e0dc",
            backgroundColor: hov ? "#f5f5f3" : "transparent",
            color: hov ? "#333" : "#888",
            cursor: cancelling ? "wait" : "pointer",
            opacity: cancelling ? 0.5 : 1,
            transition: "all 0.15s",
          }}
        >
          {cancelling ? "Cancelando..." : "Cancelar alerta"}
        </button>
      </div>
    </div>
  );
}
