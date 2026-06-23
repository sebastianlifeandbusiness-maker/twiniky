"use client";

import Link from "next/link";
import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AxiosError } from "axios";
import { authApi, avatarApi } from "@/lib/api";
import { useAuthStore } from "@/lib/store/auth";

function CompradorLoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect");
  const product = searchParams.get("product");
  const setAuth = useAuthStore((s) => s.setAuth);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const { data } = await authApi.login(email, password);
      setAuth(null, data.access_token);

      if (product) {
        try {
          await avatarApi.get();
          // 200 → tiene medidas → ir directo al probador
          router.push(`/tryon?product=${product}`);
        } catch {
          // 404 → sin medidas → configurar avatar primero
          router.push(`/avatar/setup?product=${product}`);
        }
      } else {
        router.push(redirect ?? "/marketplace");
      }
    } catch (err) {
      const detail = err instanceof AxiosError ? err.response?.data?.detail : null;
      setError(typeof detail === "string" ? detail : "Error al iniciar sesión");
    } finally {
      setLoading(false);
    }
  };

  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "12px 14px",
    fontSize: 13,
    color: "#111",
    border: "1px solid #e0e0e0",
    outline: "none",
    boxSizing: "border-box",
    marginBottom: 12,
    fontFamily: "inherit",
  };

  const labelStyle: React.CSSProperties = {
    display: "block",
    fontSize: 9,
    fontWeight: 700,
    letterSpacing: "0.18em",
    textTransform: "uppercase" as const,
    color: "#888",
    marginBottom: 6,
  };

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
      <div style={{ width: "100%", maxWidth: 480 }}>
        <Link
          href="/login"
          style={{
            display: "inline-block",
            marginBottom: 32,
            fontSize: 10,
            letterSpacing: "0.15em",
            textTransform: "uppercase",
            color: "#aaa",
            textDecoration: "none",
          }}
        >
          ← Volver
        </Link>

        <h1
          style={{
            margin: "0 0 8px",
            fontSize: 22,
            fontWeight: 300,
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            color: "#111",
          }}
        >
          Iniciar sesión
        </h1>
        <p style={{ margin: "0 0 36px", fontSize: 13, color: "#888" }}>
          Ingresa con tu email y contraseña para continuar comprando.
        </p>

        <form onSubmit={handleSubmit}>
          <label style={labelStyle}>Email *</label>
          <input
            type="email"
            placeholder="tu@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={inputStyle}
            required
          />

          <label style={labelStyle}>Contraseña *</label>
          <input
            type="password"
            placeholder="Tu contraseña"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={inputStyle}
            required
          />

          {error && (
            <p
              style={{
                marginBottom: 12,
                padding: "12px 16px",
                backgroundColor: "#fff5f5",
                border: "1px solid #fecaca",
                color: "#dc2626",
                fontSize: 13,
              }}
            >
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              width: "100%",
              padding: "13px 0",
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: "0.2em",
              textTransform: "uppercase",
              backgroundColor: loading ? "#888" : "#111",
              color: "#fff",
              border: "none",
              cursor: loading ? "not-allowed" : "pointer",
              marginBottom: 16,
              fontFamily: "inherit",
            }}
          >
            {loading ? "Entrando..." : "Entrar"}
          </button>
        </form>

        <p style={{ fontSize: 12, color: "#aaa", textAlign: "center" }}>
          ¿No tienes cuenta?{" "}
          <Link
            href={product ? `/register?product=${product}` : "/register"}
            style={{ color: "#555", textDecoration: "underline", textUnderlineOffset: 3 }}
          >
            Regístrate gratis
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function CompradorLoginPage() {
  return (
    <Suspense fallback={null}>
      <CompradorLoginForm />
    </Suspense>
  );
}
