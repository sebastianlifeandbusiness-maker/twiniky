"use client";

import { useState, FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { brandsApi } from "@/lib/api";
import { useBrandStore } from "@/lib/store/brand";

interface FormData {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  description: string;
  logo_url: string;
}

export default function BrandRegisterPage() {
  const router = useRouter();
  const setBrandSession = useBrandStore((s) => s.setBrandSession);

  const [form, setForm] = useState<FormData>({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    description: "",
    logo_url: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function set(field: keyof FormData) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm((prev) => ({ ...prev, [field]: e.target.value }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (!form.name.trim() || !form.email.trim()) {
      setError("El nombre y el email son obligatorios.");
      return;
    }
    if (!form.password || form.password.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres.");
      return;
    }
    if (form.password !== form.confirmPassword) {
      setError("Las contraseñas no coinciden.");
      return;
    }

    try {
      setLoading(true);
      await brandsApi.register({
        name: form.name.trim(),
        email: form.email.trim(),
        password: form.password,
        description: form.description.trim() || undefined,
        logo_url: form.logo_url.trim() || undefined,
      });
      // Después de registrar, hacer login automático
      const { data: tokenData } = await brandsApi.login({
        email: form.email.trim(),
        password: form.password,
      });
      setBrandSession(
        { id: tokenData.brand_id, name: tokenData.brand_name, email: form.email.trim(), logo_url: null, description: null, created_at: new Date().toISOString() },
        tokenData.access_token
      );
      router.push("/brands/dashboard");
    } catch (err: unknown) {
      const detail = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
      setError(detail ?? "No se pudo registrar la marca. Inténtalo de nuevo.");
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
          Registra tu marca
        </h1>
        <p style={{ margin: "0 0 36px", fontSize: 13, color: "#888" }}>
          Crea tu cuenta para vender en Twiniky.
        </p>

        <form onSubmit={handleSubmit}>
          <label style={labelStyle}>Nombre de la marca *</label>
          <input
            type="text"
            value={form.name}
            onChange={set("name")}
            placeholder="Ej: Studio Nómade"
            style={inputStyle}
          />

          <label style={labelStyle}>Email *</label>
          <input
            type="email"
            value={form.email}
            onChange={set("email")}
            placeholder="hola@tumarca.cl"
            style={inputStyle}
          />

          <label style={labelStyle}>Contraseña *</label>
          <input
            type="password"
            value={form.password}
            onChange={set("password")}
            placeholder="Mínimo 6 caracteres"
            style={inputStyle}
          />

          <label style={labelStyle}>Confirmar contraseña *</label>
          <input
            type="password"
            value={form.confirmPassword}
            onChange={set("confirmPassword")}
            placeholder="Repite tu contraseña"
            style={inputStyle}
          />

          <label style={labelStyle}>Descripción</label>
          <textarea
            value={form.description}
            onChange={set("description")}
            placeholder="Cuéntanos sobre tu marca..."
            rows={3}
            style={{ ...inputStyle, resize: "vertical" }}
          />

          <label style={labelStyle}>URL del logo</label>
          <input
            type="text"
            value={form.logo_url}
            onChange={set("logo_url")}
            placeholder="https://..."
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
            {loading ? "Registrando..." : "Crear cuenta"}
          </button>
        </form>

        <p style={{ fontSize: 12, color: "#aaa", textAlign: "center" }}>
          ¿Ya tienes cuenta?{" "}
          <Link
            href="/brands/login"
            style={{ color: "#555", textDecoration: "underline", textUnderlineOffset: 3 }}
          >
            Inicia sesión
          </Link>
        </p>
      </div>
    </div>
  );
}