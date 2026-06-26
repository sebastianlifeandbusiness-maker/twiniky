"use client";

import Link from "next/link";
import { useState } from "react";
import { useSearchParams } from "next/navigation";

export default function LoginSelectorPage() {
  const [hovBuyer, setHovBuyer] = useState(false);
  const [hovBrand, setHovBrand] = useState(false);
  const searchParams = useSearchParams();
  const message = searchParams.get("message");
  const productParam = searchParams.get("product");

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "#fff",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "60px 24px",
      }}
    >
      <div style={{ width: "100%", maxWidth: 560 }}>
        <Link
          href="/"
          style={{
            display: "inline-block",
            marginBottom: 48,
            fontSize: 10,
            letterSpacing: "0.15em",
            textTransform: "uppercase",
            color: "#aaa",
            textDecoration: "none",
          }}
        >
          ← Volver al inicio
        </Link>

        {message === "tryon" && (
          <div
            style={{
              marginBottom: 28,
              padding: "12px 16px",
              backgroundColor: "#f5f5f3",
              borderLeft: "3px solid #111",
              borderRadius: 4,
              fontSize: 12,
              color: "#333",
              lineHeight: 1.5,
            }}
          >
            Crea una cuenta para usar el Probador Virtual
          </div>
        )}

        <h1
          style={{
            margin: "0 0 8px",
            fontSize: 26,
            fontWeight: 300,
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            color: "#111",
            textAlign: "center",
          }}
        >
          ¿Quién eres?
        </h1>
        <p
          style={{
            margin: "0 0 48px",
            fontSize: 13,
            color: "#999",
            textAlign: "center",
          }}
        >
          Elige tu tipo de cuenta para continuar
        </p>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 16,
          }}
        >
          {/* Tarjeta comprador */}
          <Link
            href={
              productParam
                ? `/login/comprador?product=${productParam}`
                : message === "tryon"
                ? "/login/comprador?redirect=/avatar/setup"
                : searchParams.get("redirect")
                ? `/login/comprador?redirect=${encodeURIComponent(searchParams.get("redirect")!)}`
                : "/login/comprador"
            }
            onMouseEnter={() => setHovBuyer(true)}
            onMouseLeave={() => setHovBuyer(false)}
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 16,
              padding: "40px 24px",
              border: hovBuyer ? "1.5px solid #111" : "1.5px solid #e8e8e8",
              backgroundColor: hovBuyer ? "#fafafa" : "#fff",
              textDecoration: "none",
              transition: "border-color 0.15s, background-color 0.15s",
              cursor: "pointer",
            }}
          >
            <svg
              width="40"
              height="40"
              viewBox="0 0 24 24"
              fill="none"
              stroke={hovBuyer ? "#111" : "#888"}
              strokeWidth="1.4"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{ transition: "stroke 0.15s" }}
            >
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
            <div style={{ textAlign: "center" }}>
              <p
                style={{
                  margin: "0 0 4px",
                  fontSize: 13,
                  fontWeight: 600,
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                  color: "#111",
                }}
              >
                Soy comprador
              </p>
              <p style={{ margin: 0, fontSize: 11, color: "#999" }}>
                Quiero comprar ropa
              </p>
            </div>
          </Link>

          {/* Tarjeta marca */}
          <Link
            href="/brands/login"
            onMouseEnter={() => setHovBrand(true)}
            onMouseLeave={() => setHovBrand(false)}
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 16,
              padding: "40px 24px",
              border: hovBrand ? "1.5px solid #111" : "1.5px solid #e8e8e8",
              backgroundColor: hovBrand ? "#fafafa" : "#fff",
              textDecoration: "none",
              transition: "border-color 0.15s, background-color 0.15s",
              cursor: "pointer",
            }}
          >
            <svg
              width="40"
              height="40"
              viewBox="0 0 24 24"
              fill="none"
              stroke={hovBrand ? "#111" : "#888"}
              strokeWidth="1.4"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{ transition: "stroke 0.15s" }}
            >
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
              <polyline points="9 22 9 12 15 12 15 22" />
            </svg>
            <div style={{ textAlign: "center" }}>
              <p
                style={{
                  margin: "0 0 4px",
                  fontSize: 13,
                  fontWeight: 600,
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                  color: "#111",
                }}
              >
                Soy una marca
              </p>
              <p style={{ margin: 0, fontSize: 11, color: "#999" }}>
                Quiero vender mi catálogo
              </p>
            </div>
          </Link>
        </div>

        <p
          style={{
            marginTop: 32,
            fontSize: 12,
            color: "#aaa",
            textAlign: "center",
          }}
        >
          ¿No tienes cuenta?{" "}
          <Link
            href="/register"
            style={{ color: "#555", textDecoration: "underline", textUnderlineOffset: 3 }}
          >
            Regístrate como comprador
          </Link>
          {" · "}
          <Link
            href="/brands/register"
            style={{ color: "#555", textDecoration: "underline", textUnderlineOffset: 3 }}
          >
            Registra tu marca
          </Link>
        </p>
      </div>
    </div>
  );
}
