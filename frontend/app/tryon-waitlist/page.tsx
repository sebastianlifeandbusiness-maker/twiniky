"use client";

import Link from "next/link";
import { useState } from "react";
import { waitlistApi } from "@/lib/api";
import { AxiosError } from "axios";

type State = "idle" | "loading" | "success" | "error";

export default function TryonWaitlistPage() {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<State>("idle");
  const [message, setMessage] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setState("loading");
    setMessage("");
    try {
      const { data } = await waitlistApi.join(email);
      setMessage(data.message);
      setState("success");
    } catch (err) {
      const detail =
        err instanceof AxiosError ? err.response?.data?.detail : null;
      setMessage(
        typeof detail === "string"
          ? detail
          : "Algo salió mal. Intenta de nuevo."
      );
      setState("error");
    }
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "#0a0a0a",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "60px 24px",
        textAlign: "center",
      }}
    >
      {/* Ícono maniquí */}
      <svg
        width="48"
        height="48"
        viewBox="0 0 24 24"
        fill="none"
        stroke="#444"
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{ marginBottom: 32 }}
      >
        <circle cx="12" cy="4" r="2.2" />
        <path d="M9 8h6l1 6H8L9 8z" />
        <path d="M9 14l-2 6" />
        <path d="M15 14l2 6" />
      </svg>

      <p
        style={{
          margin: "0 0 16px",
          fontSize: 10,
          fontWeight: 700,
          letterSpacing: "0.3em",
          textTransform: "uppercase",
          color: "#555",
        }}
      >
        Próximamente · Probador 3D
      </p>

      <h1
        style={{
          margin: "0 0 20px",
          fontSize: "clamp(28px, 5vw, 52px)",
          fontWeight: 300,
          letterSpacing: "0.04em",
          color: "#fff",
          lineHeight: 1.15,
          maxWidth: 640,
        }}
      >
        Sé el primero<br />en probarlo
      </h1>

      <p
        style={{
          margin: "0 0 48px",
          fontSize: 15,
          color: "#555",
          maxWidth: 440,
          lineHeight: 1.7,
        }}
      >
        Estamos construyendo un probador virtual que crea un avatar 3D exacto
        de tu cuerpo a partir de dos fotos. Deja tu email y te avisamos
        cuando esté listo.
      </p>

      {state === "success" ? (
        <div
          style={{
            padding: "32px 40px",
            border: "1px solid #222",
            maxWidth: 440,
            width: "100%",
          }}
        >
          <p
            style={{
              margin: "0 0 8px",
              fontSize: 13,
              fontWeight: 600,
              color: "#fff",
              letterSpacing: "0.05em",
            }}
          >
            ¡Listo!
          </p>
          <p style={{ margin: 0, fontSize: 13, color: "#666", lineHeight: 1.6 }}>
            {message}
          </p>
        </div>
      ) : (
        <form
          onSubmit={handleSubmit}
          style={{
            display: "flex",
            gap: 0,
            maxWidth: 440,
            width: "100%",
          }}
        >
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="tu@email.com"
            required
            disabled={state === "loading"}
            style={{
              flex: 1,
              padding: "14px 16px",
              fontSize: 13,
              color: "#fff",
              backgroundColor: "#111",
              border: "1px solid #2a2a2a",
              borderRight: "none",
              outline: "none",
              fontFamily: "inherit",
              minWidth: 0,
            }}
          />
          <button
            type="submit"
            disabled={state === "loading"}
            style={{
              padding: "14px 24px",
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: "0.18em",
              textTransform: "uppercase",
              backgroundColor: state === "loading" ? "#333" : "#fff",
              color: state === "loading" ? "#666" : "#111",
              border: "none",
              cursor: state === "loading" ? "not-allowed" : "pointer",
              whiteSpace: "nowrap",
              fontFamily: "inherit",
            }}
          >
            {state === "loading" ? "..." : "Anotarme"}
          </button>
        </form>
      )}

      {state === "error" && (
        <p
          style={{
            marginTop: 16,
            fontSize: 12,
            color: "#c0392b",
          }}
        >
          {message}
        </p>
      )}

      <div
        style={{
          marginTop: 64,
          paddingTop: 32,
          borderTop: "1px solid #1a1a1a",
          width: "100%",
          maxWidth: 440,
        }}
      >
        <p style={{ margin: "0 0 16px", fontSize: 11, color: "#444" }}>
          Mientras tanto, explora el catálogo
        </p>
        <Link
          href="/marketplace"
          style={{
            fontSize: 11,
            fontWeight: 600,
            letterSpacing: "0.15em",
            textTransform: "uppercase",
            color: "#666",
            textDecoration: "none",
            borderBottom: "1px solid #333",
            paddingBottom: 2,
          }}
        >
          Ver marketplace →
        </Link>
      </div>

      <Link
        href="/"
        style={{
          marginTop: 40,
          fontSize: 10,
          letterSpacing: "0.15em",
          textTransform: "uppercase",
          color: "#333",
          textDecoration: "none",
        }}
      >
        ← Inicio
      </Link>
    </div>
  );
}
