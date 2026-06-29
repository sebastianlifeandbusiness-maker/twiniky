"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { avatarApi, apiToMeasurements, measurementsToApi } from "@/lib/api";
import { useAuthStore } from "@/lib/store/auth";
import { useBrandStore } from "@/lib/store/brand";
import type { Measurements } from "@/types";
import { getAverageMeasurements } from "@/lib/utils/chileanAverages";

const DEFAULT_MEASUREMENTS: Measurements = {
  height: 165, bust: 88, waist: 68, hips: 94,
  armLength: 58, shoeSize: 39, shoulderWidth: 40,
  torsoLength: 61, legLength: 85, armGirth: 28,
  thighGirth: 55, calfGirth: 36,
  sex: null, ageGroup: null, bodyType: null, weight: null,
};

const SLIDER_GROUPS = [
  {
    label: "General",
    sliders: [
      { field: "height" as const, label: "Altura", unit: "cm", min: 140, max: 200 },
    ],
  },
  {
    label: "Torso y hombros",
    sliders: [
      { field: "shoulderWidth" as const, label: "Ancho de hombros", unit: "cm", min: 30, max: 55 },
      { field: "torsoLength" as const,   label: "Largo de torso",   unit: "cm", min: 45, max: 75 },
      { field: "bust" as const,          label: "Busto / Pecho",    unit: "cm", min: 65, max: 130 },
      { field: "waist" as const,         label: "Cintura",          unit: "cm", min: 50, max: 110 },
      { field: "hips" as const,          label: "Cadera",           unit: "cm", min: 65, max: 130 },
    ],
  },
  {
    label: "Brazos",
    sliders: [
      { field: "armLength" as const, label: "Largo de brazo",      unit: "cm", min: 30, max: 80 },
      { field: "armGirth" as const,  label: "Contorno de bíceps",  unit: "cm", min: 18, max: 45 },
    ],
  },
  {
    label: "Piernas",
    sliders: [
      { field: "legLength" as const,  label: "Largo de pierna",         unit: "cm", min: 65, max: 105 },
      { field: "thighGirth" as const, label: "Contorno de muslo",       unit: "cm", min: 40, max: 80 },
      { field: "calfGirth" as const,  label: "Contorno de pantorrilla", unit: "cm", min: 25, max: 55 },
    ],
  },
] as const;

const SHOE_SIZES = [35, 36, 37, 38, 39, 40, 41, 42, 43, 44];

function AvatarSetupForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const productId = searchParams.get("product");
  const { token } = useAuthStore();
  const { token: brandToken } = useBrandStore();

  const [loading, setLoading] = useState(true);
  const [hasExisting, setHasExisting] = useState(false);
  const [measurements, setMeasurements] = useState<Measurements>(DEFAULT_MEASUREMENTS);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [autoFillMsg, setAutoFillMsg] = useState(false);

  // Los 3 parámetros de perfil son fuente de verdad: resetean todos los sliders
  useEffect(() => {
    const { sex, ageGroup, bodyType } = measurements;
    const needsSex = ageGroup !== "child";
    if (!ageGroup || !bodyType || (needsSex && !sex)) { setAutoFillMsg(false); return; }
    const avg = getAverageMeasurements(sex, ageGroup, bodyType);
    if (!avg) return;
    setMeasurements((prev) => ({ ...prev, ...avg }));
    setAutoFillMsg(true);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [measurements.sex, measurements.ageGroup, measurements.bodyType]);

  useEffect(() => {
    if (!token && !brandToken) {
      router.replace("/login?message=tryon");
      return;
    }
    if (brandToken && !token) {
      // Marcas no necesitan configurar avatar → ir directo al probador
      router.replace(productId ? `/tryon?product=${productId}` : "/tryon");
      return;
    }
    avatarApi.get()
      .then(({ data }) => {
        setMeasurements(apiToMeasurements(data));
        setHasExisting(true);
        // Ruta rápida: si viene de "Probar ahora" y ya tiene medidas → ir directo al probador
        if (productId) {
          router.replace(`/tryon?product=${productId}`);
          return;
        }
        setLoading(false);
      })
      .catch(() => {
        // 404 → primer uso, mostrar form con defaults
        setLoading(false);
      });
  }, [token, brandToken, router, productId]);

  async function handleSave() {
    setSaving(true);
    setError(null);
    try {
      await avatarApi.save(measurementsToApi(measurements));
      const dest = productId ? `/tryon?product=${productId}` : "/tryon";
      router.push(dest);
    } catch {
      setError("No se pudieron guardar las medidas. Intenta de nuevo.");
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          height: 300,
          color: "#bbb",
          fontSize: 12,
          letterSpacing: "0.1em",
        }}
      >
        Cargando…
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 580, margin: "0 auto" }}>
      <h1
        style={{
          margin: "0 0 6px",
          fontSize: 22,
          fontWeight: 300,
          letterSpacing: "0.1em",
          textTransform: "uppercase",
          color: "#111",
        }}
      >
        {hasExisting ? "Actualiza tu avatar" : "Configura tu avatar"}
      </h1>
      <p style={{ margin: "0 0 20px", fontSize: 13, color: "#888", lineHeight: 1.7 }}>
        {hasExisting
          ? "Ajusta tus medidas para que el probador 3D refleje tu cuerpo con precisión."
          : "Ingresa tus medidas para crear tu maniquí personalizado en el probador 3D."}
      </p>

      {autoFillMsg && (
        <div
          style={{
            backgroundColor: "#f0f7ee",
            border: "1px solid #b8d8b0",
            borderRadius: 6,
            padding: "10px 14px",
            marginBottom: 24,
            fontSize: 11,
            color: "#2d6a20",
            lineHeight: 1.6,
          }}
        >
          Medidas ajustadas según tu perfil. Puedes modificarlas.
        </div>
      )}

      {/* ── Perfil corporal ── */}
      <div style={{ marginBottom: 32 }}>
        <p
          style={{
            margin: "0 0 16px",
            fontSize: 9,
            fontWeight: 700,
            letterSpacing: "0.22em",
            textTransform: "uppercase",
            color: "#bbb",
            borderBottom: "1px solid #f0f0ee",
            paddingBottom: 6,
          }}
        >
          Perfil corporal
        </p>

        {/* Sexo */}
        <p style={{ margin: "0 0 8px", fontSize: 10, fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase", color: "#666" }}>
          Sexo
        </p>
        <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
          {([{ value: "male", label: "Masculino" }, { value: "female", label: "Femenino" }] as const).map(({ value, label }) => {
            const active = measurements.sex === value;
            return (
              <button
                key={value}
                onClick={() => setMeasurements((prev) => ({ ...prev, sex: prev.sex === value ? null : value }))}
                style={{
                  flex: 1, padding: "10px 0", fontSize: 10, fontWeight: active ? 700 : 400,
                  letterSpacing: "0.1em", textTransform: "uppercase",
                  border: `1px solid ${active ? "#111" : "#e0e0dc"}`,
                  backgroundColor: active ? "#111" : "#fff",
                  color: active ? "#fff" : "#555",
                  cursor: "pointer", borderRadius: 4, transition: "all 0.15s",
                }}
              >
                {label}
              </button>
            );
          })}
        </div>

        {/* Grupo de edad */}
        <p style={{ margin: "0 0 8px", fontSize: 10, fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase", color: "#666" }}>
          Edad
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6, marginBottom: 20 }}>
          {([
            { value: "child",  label: "Niño (8–12)" },
            { value: "teen",   label: "Adolescente (13–17)" },
            { value: "adult",  label: "Adulto (18–59)" },
            { value: "senior", label: "Mayor (60+)" },
          ] as const).map(({ value, label }) => {
            const active = measurements.ageGroup === value;
            return (
              <button
                key={value}
                onClick={() => setMeasurements((prev) => ({ ...prev, ageGroup: prev.ageGroup === value ? null : value }))}
                style={{
                  padding: "9px 0", fontSize: 9, fontWeight: active ? 700 : 400,
                  letterSpacing: "0.1em", textTransform: "uppercase",
                  border: `1px solid ${active ? "#111" : "#e0e0dc"}`,
                  backgroundColor: active ? "#111" : "#fff",
                  color: active ? "#fff" : "#555",
                  cursor: "pointer", borderRadius: 4, transition: "all 0.15s",
                }}
              >
                {label}
              </button>
            );
          })}
        </div>

        {/* Contextura */}
        <p style={{ margin: "0 0 8px", fontSize: 10, fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase", color: "#666" }}>
          Contextura
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6, marginBottom: 20 }}>
          {([
            { value: "slim",       label: "Delgado" },
            { value: "normal",     label: "Normal" },
            { value: "athletic",   label: "Atlético" },
            { value: "overweight", label: "Robusto" },
          ] as const).map(({ value, label }) => {
            const active = measurements.bodyType === value;
            return (
              <button
                key={value}
                onClick={() => setMeasurements((prev) => ({ ...prev, bodyType: prev.bodyType === value ? null : value }))}
                style={{
                  padding: "9px 0", fontSize: 9, fontWeight: active ? 700 : 400,
                  letterSpacing: "0.1em", textTransform: "uppercase",
                  border: `1px solid ${active ? "#111" : "#e0e0dc"}`,
                  backgroundColor: active ? "#111" : "#fff",
                  color: active ? "#fff" : "#555",
                  cursor: "pointer", borderRadius: 4, transition: "all 0.15s",
                }}
              >
                {label}
              </button>
            );
          })}
        </div>

        {/* Tono de piel */}
        <p style={{ margin: "0 0 8px", fontSize: 10, fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase", color: "#666" }}>
          Tono de piel
        </p>
        <div style={{ display: "flex", gap: 10, marginBottom: 20, flexWrap: "wrap" }}>
          {([
            { value: "#F5DEB3", label: "Muy claro" },
            { value: "#E8C99A", label: "Claro" },
            { value: "#C8956C", label: "Medio" },
            { value: "#A0674A", label: "Moreno" },
            { value: "#7B4A2D", label: "Oscuro" },
            { value: "#4A2512", label: "Muy oscuro" },
          ] as const).map(({ value, label }) => {
            const active = measurements.skinTone === value;
            return (
              <button
                key={value}
                title={label}
                onClick={() => setMeasurements((prev) => ({ ...prev, skinTone: prev.skinTone === value ? null : value }))}
                style={{
                  width: 30, height: 30, borderRadius: "50%",
                  backgroundColor: value,
                  border: active ? "2.5px solid #111" : "2px solid transparent",
                  outline: active ? "2px solid #fff" : "none",
                  outlineOffset: -4,
                  cursor: "pointer", padding: 0,
                  boxShadow: "0 0 0 1px #ccc",
                  transition: "border 0.12s, outline 0.12s",
                }}
              />
            );
          })}
        </div>

        {/* Peso */}
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 6 }}>
            <label style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase", color: "#666" }}>
              Peso (opcional)
            </label>
            <div style={{ display: "flex", alignItems: "baseline", gap: 4 }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: "#111" }}>
                {measurements.weight != null ? measurements.weight : "—"}
                {measurements.weight != null && (
                  <span style={{ fontSize: 9, fontWeight: 400, color: "#aaa" }}> kg</span>
                )}
              </span>
              {measurements.weight != null && (
                <button
                  onClick={() => setMeasurements((prev) => ({ ...prev, weight: null }))}
                  style={{ fontSize: 11, color: "#bbb", background: "none", border: "none", cursor: "pointer", padding: "0 2px", lineHeight: 1 }}
                >
                  ×
                </button>
              )}
            </div>
          </div>
          <input
            type="range"
            min={20} max={150}
            value={measurements.weight ?? 65}
            onChange={(e) => {
              setMeasurements((prev) => ({ ...prev, weight: Number(e.target.value) }));
            }}
            style={{ width: "100%", accentColor: "#111", cursor: "pointer", opacity: measurements.weight != null ? 1 : 0.35 }}
          />
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 3, fontSize: 9, color: "#ddd" }}>
            <span>20</span><span>150</span>
          </div>
        </div>
      </div>

      {/* Sliders */}
      {SLIDER_GROUPS.map((group) => (
        <div key={group.label} style={{ marginBottom: 28 }}>
          <p
            style={{
              margin: "0 0 14px",
              fontSize: 9,
              fontWeight: 700,
              letterSpacing: "0.22em",
              textTransform: "uppercase",
              color: "#bbb",
              borderBottom: "1px solid #f0f0ee",
              paddingBottom: 6,
            }}
          >
            {group.label}
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
            {group.sliders.map(({ field, label, unit, min, max }) => (
              <div key={field}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "baseline",
                    marginBottom: 6,
                  }}
                >
                  <label
                    style={{
                      fontSize: 11,
                      fontWeight: 600,
                      letterSpacing: "0.1em",
                      textTransform: "uppercase",
                      color: "#444",
                    }}
                  >
                    {label}
                  </label>
                  <span style={{ fontSize: 13, fontWeight: 600, color: "#111" }}>
                    {measurements[field]}{" "}
                    <span style={{ fontSize: 9, fontWeight: 400, color: "#aaa" }}>{unit}</span>
                  </span>
                </div>
                <input
                  type="range"
                  min={min}
                  max={max}
                  value={measurements[field]}
                  onChange={(e) => {
                    setMeasurements((prev) => ({ ...prev, [field]: Number(e.target.value) }));
                  }}
                  style={{ width: "100%", accentColor: "#111", cursor: "pointer" }}
                />
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginTop: 3,
                    fontSize: 9,
                    color: "#ddd",
                  }}
                >
                  <span>{min}</span>
                  <span>{max}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}

      {/* Talla de pie */}
      <div style={{ marginBottom: 40 }}>
        <p
          style={{
            margin: "0 0 14px",
            fontSize: 9,
            fontWeight: 700,
            letterSpacing: "0.22em",
            textTransform: "uppercase",
            color: "#bbb",
            borderBottom: "1px solid #f0f0ee",
            paddingBottom: 6,
          }}
        >
          Calzado
        </p>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "baseline",
            marginBottom: 12,
          }}
        >
          <label
            style={{
              fontSize: 11,
              fontWeight: 600,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              color: "#444",
            }}
          >
            Talla de pie
          </label>
          <span style={{ fontSize: 13, fontWeight: 600, color: "#111" }}>
            {measurements.shoeSize}{" "}
            <span style={{ fontSize: 9, fontWeight: 400, color: "#aaa" }}>EU</span>
          </span>
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
          {SHOE_SIZES.map((size) => {
            const active = measurements.shoeSize === size;
            return (
              <button
                key={size}
                onClick={() => {
                  setMeasurements((prev) => ({ ...prev, shoeSize: size }));
                }}
                style={{
                  width: 42,
                  height: 36,
                  fontSize: 11,
                  fontWeight: active ? 700 : 400,
                  border: `1px solid ${active ? "#111" : "#e0e0dc"}`,
                  backgroundColor: active ? "#111" : "#fff",
                  color: active ? "#fff" : "#555",
                  cursor: "pointer",
                  borderRadius: 4,
                  transition: "background-color 0.15s, color 0.15s, border-color 0.15s",
                }}
              >
                {size}
              </button>
            );
          })}
        </div>
      </div>

      {error && (
        <p style={{ margin: "0 0 16px", fontSize: 12, color: "#cc2200" }}>{error}</p>
      )}

      <button
        onClick={handleSave}
        disabled={saving}
        style={{
          width: "100%",
          padding: "14px 0",
          fontSize: 10,
          fontWeight: 700,
          letterSpacing: "0.2em",
          textTransform: "uppercase",
          backgroundColor: saving ? "#888" : "#111",
          color: "#fff",
          border: "none",
          borderRadius: 6,
          cursor: saving ? "wait" : "pointer",
          transition: "background-color 0.15s",
        }}
      >
        {saving ? "Guardando…" : "Guardar medidas"}
      </button>
    </div>
  );
}

export default function AvatarSetupPage() {
  return (
    <main style={{ maxWidth: 1200, margin: "0 auto", padding: "48px 24px 80px" }}>
      <Suspense
        fallback={
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              height: 300,
              color: "#bbb",
              fontSize: 12,
              letterSpacing: "0.1em",
            }}
          >
            Cargando…
          </div>
        }
      >
        <AvatarSetupForm />
      </Suspense>
    </main>
  );
}
