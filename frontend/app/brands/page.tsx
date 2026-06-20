"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useBrandStore } from "@/lib/store/brand";

const FEATURES = [
  {
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="3" width="20" height="14" rx="2" />
        <path d="M8 21h8M12 17v4" />
      </svg>
    ),
    title: "Panel de gestión",
    body: "Sube y administra todo tu catálogo desde un solo lugar. Actualiza precios, tallas y fotos cuando quieras.",
  },
  {
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" />
      </svg>
    ),
    title: "Alcance real",
    body: "Tus productos llegan a compradores que ya están buscando prendas como las tuyas. Sin publicidad, sin algoritmos opacos.",
  },
  {
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
      </svg>
    ),
    title: "Probador 3D",
    body: "Los clientes pueden probarse virtualmente tus prendas antes de comprar. Menos devoluciones, más confianza.",
  },
  {
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
        <line x1="12" y1="1" x2="12" y2="23" />
        <path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" />
      </svg>
    ),
    title: "Sin comisiones iniciales",
    body: "Regístrate gratis. Sin cuota mensual ni porcentaje sobre ventas durante el período de lanzamiento.",
  },
];

export default function BrandsLandingPage() {
  const router = useRouter();
  const { token: brandToken } = useBrandStore();

  useEffect(() => {
    if (brandToken) router.replace("/brands/dashboard");
  }, [brandToken, router]);

  if (brandToken) return null;

  return (
    <div style={{ backgroundColor: "#fff", minHeight: "100vh", fontFamily: "inherit" }}>

      {/* ── Hero ── */}
      <div
        style={{
          borderBottom: "1px solid #ebebeb",
          padding: "80px 40px 72px",
          textAlign: "center",
          maxWidth: 740,
          margin: "0 auto",
        }}
      >
        <p
          style={{
            margin: "0 0 16px",
            fontSize: 10,
            fontWeight: 700,
            letterSpacing: "0.28em",
            textTransform: "uppercase",
            color: "#aaa",
          }}
        >
          Twiniky para marcas
        </p>
        <h1
          style={{
            margin: "0 0 20px",
            fontSize: 38,
            fontWeight: 300,
            letterSpacing: "0.06em",
            lineHeight: 1.2,
            color: "#111",
          }}
        >
          Lleva tu marca al próximo nivel
        </h1>
        <p
          style={{
            margin: "0 0 40px",
            fontSize: 15,
            color: "#888",
            lineHeight: 1.7,
            maxWidth: 520,
            marginLeft: "auto",
            marginRight: "auto",
          }}
        >
          Vende en el marketplace de moda chileno con probador virtual 3D.
          Regístrate, sube tu catálogo y empieza a vender hoy mismo. Es gratis.
        </p>

        <div style={{ display: "flex", gap: 16, justifyContent: "center", flexWrap: "wrap" }}>
          <Link
            href="/brands/register"
            style={{
              display: "inline-block",
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: "0.2em",
              textTransform: "uppercase",
              color: "#fff",
              backgroundColor: "#111",
              padding: "15px 36px",
              textDecoration: "none",
            }}
          >
            Registra tu marca gratis
          </Link>
          <Link
            href="/brands/dashboard"
            style={{
              display: "inline-block",
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: "0.2em",
              textTransform: "uppercase",
              color: "#555",
              backgroundColor: "transparent",
              padding: "15px 36px",
              textDecoration: "none",
              border: "1px solid #ddd",
            }}
          >
            Acceder a mi panel
          </Link>
        </div>
      </div>

      {/* ── Features ── */}
      <div
        style={{
          maxWidth: 1100,
          margin: "0 auto",
          padding: "72px 40px",
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: 48,
        }}
      >
        {FEATURES.map((f) => (
          <FeatureCard key={f.title} icon={f.icon} title={f.title} body={f.body} />
        ))}
      </div>

      {/* ── How it works ── */}
      <div style={{ borderTop: "1px solid #ebebeb", backgroundColor: "#fafaf8", padding: "72px 40px" }}>
        <div style={{ maxWidth: 860, margin: "0 auto" }}>
          <p
            style={{
              textAlign: "center",
              margin: "0 0 48px",
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: "0.28em",
              textTransform: "uppercase",
              color: "#aaa",
            }}
          >
            Cómo funciona
          </p>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              gap: 32,
            }}
          >
            {[
              { step: "01", title: "Regístrate", body: "Crea el perfil de tu marca en menos de 2 minutos. Solo necesitas nombre, email y una descripción." },
              { step: "02", title: "Sube tu catálogo", body: "Agrega productos con fotos, precios en CLP, tallas y categorías desde tu panel de gestión." },
              { step: "03", title: "Empieza a vender", body: "Tus productos aparecen en el catálogo de Twiniky y los clientes los descubren con el probador 3D." },
            ].map((s) => (
              <div key={s.step} style={{ textAlign: "center" }}>
                <p
                  style={{
                    margin: "0 0 12px",
                    fontSize: 28,
                    fontWeight: 200,
                    letterSpacing: "0.1em",
                    color: "#ddd",
                  }}
                >
                  {s.step}
                </p>
                <p
                  style={{
                    margin: "0 0 8px",
                    fontSize: 11,
                    fontWeight: 700,
                    letterSpacing: "0.18em",
                    textTransform: "uppercase",
                    color: "#111",
                  }}
                >
                  {s.title}
                </p>
                <p style={{ margin: 0, fontSize: 13, color: "#888", lineHeight: 1.6 }}>
                  {s.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── CTA bottom ── */}
      <div
        style={{
          textAlign: "center",
          padding: "72px 40px",
          borderTop: "1px solid #ebebeb",
        }}
      >
        <h2
          style={{
            margin: "0 0 16px",
            fontSize: 26,
            fontWeight: 300,
            letterSpacing: "0.08em",
            color: "#111",
          }}
        >
          ¿Lista para empezar?
        </h2>
        <p style={{ margin: "0 0 36px", fontSize: 14, color: "#888" }}>
          Únete a las primeras marcas en Twiniky y aprovecha el período de lanzamiento gratuito.
        </p>
        <Link
          href="/brands/register"
          style={{
            display: "inline-block",
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: "0.2em",
            textTransform: "uppercase",
            color: "#fff",
            backgroundColor: "#111",
            padding: "15px 40px",
            textDecoration: "none",
          }}
        >
          Registra tu marca
        </Link>
      </div>
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  body,
}: {
  icon: React.ReactNode;
  title: string;
  body: string;
}) {
  return (
    <div>
      <div
        style={{
          width: 52,
          height: 52,
          border: "1px solid #ebebeb",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: 20,
          color: "#555",
        }}
      >
        {icon}
      </div>
      <p
        style={{
          margin: "0 0 8px",
          fontSize: 11,
          fontWeight: 700,
          letterSpacing: "0.18em",
          textTransform: "uppercase",
          color: "#111",
        }}
      >
        {title}
      </p>
      <p style={{ margin: 0, fontSize: 13, color: "#888", lineHeight: 1.6 }}>
        {body}
      </p>
    </div>
  );
}
