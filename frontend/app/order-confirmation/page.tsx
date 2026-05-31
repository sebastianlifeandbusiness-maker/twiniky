"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useAuthStore } from "@/lib/store/auth";

function OrderConfirmationContent() {
  const searchParams = useSearchParams();
  const rawId = searchParams.get("order_id") ?? "";
  const orderNumber = rawId ? `TW-${rawId.replace(/-/g, "").slice(0, 8).toUpperCase()}` : "TW---------";

  const [hov, setHov] = useState(false);
  const [mounted, setMounted] = useState(false);
  const token = useAuthStore((s) => s.token);

  useEffect(() => setMounted(true), []);

  const isGuest = mounted && !token;

  return (
    <div
      style={{
        minHeight: "80vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
        padding: "60px 32px",
        backgroundColor: "#fff",
      }}
    >
      {/* Check icon */}
      <div
        style={{
          width: 72,
          height: 72,
          borderRadius: "50%",
          backgroundColor: "#f0fdf4",
          border: "1px solid #bbf7d0",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: 28,
        }}
      >
        <svg
          width="32"
          height="32"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#16a34a"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polyline points="20 6 9 17 4 12" />
        </svg>
      </div>

      {/* Title */}
      <h1
        style={{
          margin: "0 0 8px",
          fontSize: 26,
          fontWeight: 300,
          letterSpacing: "0.1em",
          textTransform: "uppercase",
          color: "#111",
        }}
      >
        ¡Pedido confirmado!
      </h1>

      <p
        style={{
          margin: "0 0 28px",
          fontSize: 14,
          color: "#888",
          lineHeight: 1.6,
          maxWidth: 420,
        }}
      >
        Gracias por tu compra. Hemos recibido tu pedido y lo estamos procesando.
        Te enviaremos una confirmación a tu correo electrónico.
      </p>

      {/* Order number box */}
      <div
        style={{
          border: "1px solid #ebebeb",
          padding: "20px 36px",
          marginBottom: 40,
          backgroundColor: "#fafaf8",
        }}
      >
        <p
          style={{
            margin: "0 0 4px",
            fontSize: 9,
            fontWeight: 700,
            letterSpacing: "0.22em",
            textTransform: "uppercase",
            color: "#aaa",
          }}
        >
          Número de pedido
        </p>
        <p
          style={{
            margin: 0,
            fontSize: 22,
            fontWeight: 600,
            letterSpacing: "0.08em",
            color: "#111",
            fontVariantNumeric: "tabular-nums",
          }}
        >
          {orderNumber}
        </p>
      </div>

      {/* Info cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: 16,
          marginBottom: 48,
          maxWidth: 600,
          width: "100%",
        }}
      >
        <InfoCard icon="📦" title="Preparación" body="Tu pedido se prepara en 1-2 días hábiles" />
        <InfoCard icon="🚚" title="Envío" body="Entrega estimada en 3-5 días hábiles" />
        <InfoCard icon="✉️" title="Seguimiento" body="Te avisaremos por email cuando salga" />
      </div>

      {/* Guest CTA — only shown when not logged in */}
      {isGuest && (
        <div
          style={{
            maxWidth: 480,
            width: "100%",
            border: "1px solid #e8e4dc",
            backgroundColor: "#fdfcf8",
            padding: "28px 32px",
            marginBottom: 36,
            textAlign: "center",
          }}
        >
          <p
            style={{
              margin: "0 0 6px",
              fontSize: 18,
              fontWeight: 300,
              letterSpacing: "0.04em",
              color: "#111",
            }}
          >
            ¿Quieres guardar tu historial?
          </p>
          <p
            style={{
              margin: "0 0 20px",
              fontSize: 13,
              color: "#888",
              lineHeight: 1.6,
            }}
          >
            Crea tu cuenta gratis para ver tus pedidos anteriores y usar el{" "}
            <strong style={{ color: "#111", fontWeight: 500 }}>probador 3D</strong> de Twiniky.
          </p>
          <Link
            href="/register"
            style={{
              display: "inline-block",
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: "0.2em",
              textTransform: "uppercase",
              color: "#fff",
              backgroundColor: "#111",
              padding: "13px 28px",
              textDecoration: "none",
            }}
          >
            Crear cuenta gratis
          </Link>
        </div>
      )}

      {/* CTAs */}
      <div style={{ display: "flex", gap: 16, flexWrap: "wrap", justifyContent: "center" }}>
        <Link
          href="/marketplace"
          onMouseEnter={() => setHov(true)}
          onMouseLeave={() => setHov(false)}
          style={{
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: "0.22em",
            textTransform: "uppercase",
            color: "#fff",
            backgroundColor: hov ? "#222" : "#111",
            padding: "14px 32px",
            textDecoration: "none",
            transition: "background 0.2s",
            display: "inline-block",
          }}
        >
          Seguir comprando
        </Link>
        {!isGuest && (
          <Link
            href="/orders"
            style={{
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: "0.22em",
              textTransform: "uppercase",
              color: "#111",
              backgroundColor: "transparent",
              padding: "14px 32px",
              textDecoration: "none",
              border: "1px solid #ddd",
              display: "inline-block",
            }}
          >
            Mis pedidos
          </Link>
        )}
      </div>
    </div>
  );
}

function InfoCard({ icon, title, body }: { icon: string; title: string; body: string }) {
  return (
    <div
      style={{
        border: "1px solid #ebebeb",
        padding: "16px 12px",
        backgroundColor: "#fff",
        textAlign: "center",
      }}
    >
      <p style={{ margin: "0 0 6px", fontSize: 20 }}>{icon}</p>
      <p
        style={{
          margin: "0 0 4px",
          fontSize: 10,
          fontWeight: 700,
          letterSpacing: "0.15em",
          textTransform: "uppercase",
          color: "#111",
        }}
      >
        {title}
      </p>
      <p style={{ margin: 0, fontSize: 11, color: "#888", lineHeight: 1.5 }}>{body}</p>
    </div>
  );
}

export default function OrderConfirmationPage() {
  return (
    <Suspense fallback={null}>
      <OrderConfirmationContent />
    </Suspense>
  );
}
