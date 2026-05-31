"use client";

import { useState, FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { brandsApi } from "@/lib/api";
import { useBrandStore } from "@/lib/store/brand";

export default function BrandLoginPage() {
  const router = useRouter();
  const setBrandSession = useBrandStore((s) => s.setBrandSession);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (!email.trim() || !password) {
      setError("Email y contraseña son obligatorios.");
      return;
    }

    try {
      setLoading(true);
      const { data } = await brandsApi.login({ email: email.trim(), password });
      setBrandSession(
        {
          id: data.brand_id,
          name: data.brand_name,
          email: email.trim(),
          logo_url: null,
          description: null,
          created_at: new Date().toISOString(),
        },
        data.access_token
      );
      router.push("/brands/dashboard");
    } catch (err: unknown) {
      const detail = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
      setError(detail ?? "Email o contraseña incorrectos.");
    } finally {
      setLoading(false);
    }
  }

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
    textTransform: "uppercase",
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
          href="/brands"
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
          Panel de marca
        </h1>
        <p style={{ margin: "0 0 36px", fontSize: 13, color: "#888" }}>
          Ingresa con tu email y contraseña para acceder a tu panel.
        </p>

        <form onSubmit={handleSubmit}>
          <label style={labelStyle}>Email *</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="hola@tumarca.cl"
            style={inputStyle}
          />

          <label style={labelStyle}>Contraseña *</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Tu contraseña"
            style={inputStyle}
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
            }}
          >
            {loading ? "Ingresando..." : "Ingresar"}
          </button>
        </form>

        <p style={{ fontSize: 12, color: "#aaa", textAlign: "center" }}>
          ¿No tienes cuenta?{" "}
          <Link
            href="/brands/register"
            style={{ color: "#555", textDecoration: "underline", textUnderlineOffset: 3 }}
          >
            Registra tu marca gratis
          </Link>
        </p>
      </div>
    </div>
  );
}