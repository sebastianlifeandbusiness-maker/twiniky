"use client";

import { useEffect, useRef, useState } from "react";
import type { Measurements } from "@/types";
import { api } from "@/lib/api";
import { useAuthStore } from "@/lib/store/auth";
import { getAverageMeasurements } from "@/lib/utils/chileanAverages";

const PHOTO_SLOTS = [
  { key: "frontal",    label: "Frontal" },
  { key: "perfil_izq", label: "Perfil Izq." },
  { key: "perfil_der", label: "Perfil Der." },
  { key: "espalda",   label: "Espalda" },
] as const;

type PhotoKey = typeof PHOTO_SLOTS[number]["key"];

interface Props {
  defaultMeasurements: Measurements;
  onComplete: (m: Measurements) => void;
}

export function BodyCapture({ defaultMeasurements, onComplete }: Props) {
  const { token } = useAuthStore();
  const [tab, setTab] = useState<"fotos" | "medidas">("fotos");
  const [photos, setPhotos] = useState<Record<PhotoKey, File | null>>({
    frontal: null,
    perfil_izq: null,
    perfil_der: null,
    espalda: null,
  });
  const [measurements, setMeasurements] = useState<Measurements>(defaultMeasurements);
  const [uploading, setUploading] = useState(false);
  const [autoFillMsg, setAutoFillMsg] = useState(false);
  const fileRefs = useRef<Partial<Record<PhotoKey, HTMLInputElement | null>>>({});

  const allPhotos = PHOTO_SLOTS.every(({ key }) => photos[key] !== null);
  const anyPhoto = PHOTO_SLOTS.some(({ key }) => photos[key] !== null);

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

  async function handlePhotosContinue() {
    if (allPhotos && token) {
      setUploading(true);
      try {
        const form = new FormData();
        form.append("frontal",    photos.frontal!,    "frontal.jpg");
        form.append("perfil_izq", photos.perfil_izq!, "perfil_izq.jpg");
        form.append("perfil_der", photos.perfil_der!, "perfil_der.jpg");
        form.append("espalda",    photos.espalda!,    "espalda.jpg");
        await api.post("/tryon/upload-photos", form, {
          headers: { "Content-Type": "multipart/form-data" },
        });
      } catch {
        // Si falla el upload, continuamos igual con medidas promedio
      } finally {
        setUploading(false);
      }
    }
    onComplete(defaultMeasurements);
  }

  return (
    <div
      style={{
        maxWidth: 600,
        margin: "0 auto",
        backgroundColor: "#fff",
        border: "1px solid #e8e8e8",
        borderRadius: 12,
        overflow: "hidden",
      }}
    >
      {/* Tabs */}
      <div style={{ display: "flex", borderBottom: "1px solid #e8e8e8" }}>
        {(["fotos", "medidas"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            style={{
              flex: 1,
              padding: "16px 0",
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: "0.18em",
              textTransform: "uppercase",
              background: "none",
              border: "none",
              borderBottom: `2px solid ${tab === t ? "#111" : "transparent"}`,
              cursor: "pointer",
              color: tab === t ? "#111" : "#bbb",
              transition: "color 0.15s, border-color 0.15s",
            }}
          >
            {t === "fotos" ? "Subir fotos" : "Medidas manuales"}
          </button>
        ))}
      </div>

      <div style={{ padding: "32px 40px 40px" }}>
        {tab === "fotos" ? (
          <>
            <p style={{ margin: "0 0 8px", fontSize: 13, fontWeight: 600, color: "#111" }}>
              Captura tu cuerpo con 4 fotos
            </p>
            <p style={{ margin: "0 0 28px", fontSize: 12, color: "#888", lineHeight: 1.7 }}>
              Usa ropa ajustada y un fondo neutro. Las fotos se guardan de forma segura
              y servirán para generar tu avatar personalizado cuando esté listo el motor 3D.
            </p>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 16,
                marginBottom: 28,
              }}
            >
              {PHOTO_SLOTS.map(({ key, label }) => {
                const file = photos[key];
                const preview = file ? URL.createObjectURL(file) : null;
                return (
                  <div key={key}>
                    <p
                      style={{
                        margin: "0 0 8px",
                        fontSize: 9,
                        fontWeight: 700,
                        letterSpacing: "0.2em",
                        textTransform: "uppercase",
                        color: "#999",
                      }}
                    >
                      {label}
                    </p>
                    <button
                      onClick={() => fileRefs.current[key]?.click()}
                      style={{
                        width: "100%",
                        aspectRatio: "3/4",
                        border: `2px dashed ${file ? "#111" : "#ddd"}`,
                        borderRadius: 8,
                        backgroundColor: file ? "#f8f7f5" : "#fafaf9",
                        cursor: "pointer",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 6,
                        overflow: "hidden",
                        padding: 0,
                      }}
                    >
                      {preview ? (
                        <img
                          src={preview}
                          alt={label}
                          style={{ width: "100%", height: "100%", objectFit: "cover" }}
                        />
                      ) : (
                        <>
                          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#ccc" strokeWidth="1.5">
                            <rect x="3" y="3" width="18" height="18" rx="2" />
                            <circle cx="8.5" cy="8.5" r="1.5" />
                            <polyline points="21 15 16 10 5 21" />
                          </svg>
                          <span
                            style={{
                              fontSize: 9,
                              color: "#ccc",
                              letterSpacing: "0.12em",
                              textTransform: "uppercase",
                            }}
                          >
                            Seleccionar
                          </span>
                        </>
                      )}
                    </button>
                    <input
                      ref={(el) => { fileRefs.current[key] = el; }}
                      type="file"
                      accept="image/*"
                      style={{ display: "none" }}
                      onChange={(e) => {
                        const f = e.target.files?.[0] ?? null;
                        setPhotos((prev) => ({ ...prev, [key]: f }));
                      }}
                    />
                  </div>
                );
              })}
            </div>

            {!token && anyPhoto && (
              <div
                style={{
                  backgroundColor: "#fdf8ee",
                  border: "1px solid #f0e0a0",
                  borderRadius: 6,
                  padding: "10px 14px",
                  marginBottom: 16,
                  fontSize: 11,
                  color: "#887733",
                  lineHeight: 1.6,
                }}
              >
                Inicia sesión para guardar tus fotos en tu perfil.
              </div>
            )}

            <button
              onClick={handlePhotosContinue}
              disabled={uploading}
              style={{
                width: "100%",
                padding: "14px 0",
                fontSize: 10,
                fontWeight: 700,
                letterSpacing: "0.2em",
                textTransform: "uppercase",
                backgroundColor: "#111",
                color: "#fff",
                border: "none",
                borderRadius: 6,
                cursor: uploading ? "wait" : "pointer",
                opacity: uploading ? 0.7 : 1,
              }}
            >
              {uploading
                ? "Guardando fotos…"
                : allPhotos && token
                ? "Guardar fotos y continuar"
                : "Continuar con medidas promedio"}
            </button>
          </>
        ) : (
          <>
            <p style={{ margin: "0 0 8px", fontSize: 13, fontWeight: 600, color: "#111" }}>
              Ingresa tus medidas
            </p>
            <p style={{ margin: "0 0 16px", fontSize: 12, color: "#888", lineHeight: 1.7 }}>
              El avatar se ajustará en tiempo real mientras mueves los controles deslizantes.
            </p>
            {autoFillMsg && (
              <div
                style={{
                  backgroundColor: "#f0f7ee",
                  border: "1px solid #b8d8b0",
                  borderRadius: 6,
                  padding: "10px 14px",
                  marginBottom: 20,
                  fontSize: 11,
                  color: "#2d6a20",
                  lineHeight: 1.6,
                }}
              >
                Medidas ajustadas según tu perfil. Puedes modificarlas.
              </div>
            )}

            {/* ── Perfil corporal ── */}
            <div style={{ marginBottom: 24 }}>
              <p
                style={{
                  margin: "0 0 14px",
                  fontSize: 9,
                  fontWeight: 700,
                  letterSpacing: "0.2em",
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
              <div style={{ display: "flex", gap: 8, marginBottom: 18 }}>
                {([{ value: "male", label: "Masculino" }, { value: "female", label: "Femenino" }] as const).map(({ value, label }) => {
                  const active = measurements.sex === value;
                  return (
                    <button
                      key={value}
                      onClick={() => setMeasurements((prev) => ({ ...prev, sex: prev.sex === value ? null : value }))}
                      style={{
                        flex: 1, padding: "9px 0", fontSize: 10, fontWeight: active ? 700 : 400,
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
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6, marginBottom: 18 }}>
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
                        padding: "8px 0", fontSize: 9, fontWeight: active ? 700 : 400,
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
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6, marginBottom: 18 }}>
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
                        padding: "8px 0", fontSize: 9, fontWeight: active ? 700 : 400,
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
              <div style={{ display: "flex", gap: 10, marginBottom: 18, flexWrap: "wrap" }}>
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

            {([
              {
                label: "General",
                sliders: [
                  { field: "height" as const, label: "Altura", unit: "cm", min: 140, max: 200 },
                ],
              },
              {
                label: "Torso y hombros",
                sliders: [
                  { field: "shoulderWidth" as const, label: "Ancho de hombros", unit: "cm", min: 30, max: 55  },
                  { field: "torsoLength"   as const, label: "Largo de torso",   unit: "cm", min: 45, max: 75  },
                  { field: "bust"          as const, label: "Busto / Pecho",    unit: "cm", min: 65, max: 130 },
                  { field: "waist"         as const, label: "Cintura",          unit: "cm", min: 50, max: 110 },
                  { field: "hips"          as const, label: "Cadera",           unit: "cm", min: 65, max: 130 },
                ],
              },
              {
                label: "Brazos",
                sliders: [
                  { field: "armLength" as const, label: "Largo de brazo",     unit: "cm", min: 30, max: 80 },
                  { field: "armGirth"  as const, label: "Contorno de bíceps", unit: "cm", min: 18, max: 45 },
                ],
              },
              {
                label: "Piernas",
                sliders: [
                  { field: "legLength"  as const, label: "Largo de pierna",        unit: "cm", min: 65, max: 105 },
                  { field: "thighGirth" as const, label: "Contorno de muslo",      unit: "cm", min: 40, max: 80  },
                  { field: "calfGirth"  as const, label: "Contorno de pantorrilla", unit: "cm", min: 25, max: 55 },
                ],
              },
            ] as const).map((group) => (
              <div key={group.label} style={{ marginBottom: 24 }}>
                <p
                  style={{
                    margin: "0 0 14px",
                    fontSize: 9,
                    fontWeight: 700,
                    letterSpacing: "0.2em",
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

            {/* ── Talla de pie ── */}
            <div style={{ marginBottom: 36 }}>
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
                    letterSpacing: "0.12em",
                    textTransform: "uppercase",
                    color: "#444",
                  }}
                >
                  Talla de pie
                </label>
                <span style={{ fontSize: 14, fontWeight: 600, color: "#111" }}>
                  {measurements.shoeSize}{" "}
                  <span style={{ fontSize: 10, fontWeight: 400, color: "#999" }}>EU</span>
                </span>
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {[35, 36, 37, 38, 39, 40, 41, 42, 43, 44].map((size) => {
                  const active = measurements.shoeSize === size;
                  return (
                    <button
                      key={size}
                      onClick={() => {
                        setMeasurements((prev) => ({ ...prev, shoeSize: size }));
                      }}
                      style={{
                        width: 40,
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

            <button
              onClick={() => onComplete(measurements)}
              style={{
                width: "100%",
                padding: "14px 0",
                fontSize: 10,
                fontWeight: 700,
                letterSpacing: "0.2em",
                textTransform: "uppercase",
                backgroundColor: "#111",
                color: "#fff",
                border: "none",
                borderRadius: 6,
                cursor: "pointer",
              }}
            >
              Usar estas medidas
            </button>
          </>
        )}
      </div>
    </div>
  );
}
