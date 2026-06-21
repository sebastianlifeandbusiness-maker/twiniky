"use client";

import { Suspense, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { MannequinFigure } from "./MannequinFigure";
import { useProduct } from "@/lib/hooks/useProducts";
import { formatCLP } from "@/lib/utils/format";
import type { Measurements } from "@/types";

const SCENES = [
  {
    id: "studio",
    label: "Estudio",
    bg: "#f0eee9",
    swatch: "#f0eee9",
    ambientInt: 0.9,
    dirInt: 0.9,
    dirColor: "#ffffff",
    extraLight: null,
  },
  {
    id: "office",
    label: "Oficina",
    bg: "#e6e0d2",
    swatch: "#e6e0d2",
    ambientInt: 0.7,
    dirInt: 0.75,
    dirColor: "#fff5dc",
    extraLight: null,
  },
  {
    id: "street",
    label: "Calle",
    bg: "#b0bec8",
    swatch: "#b0bec8",
    ambientInt: 0.6,
    dirInt: 0.65,
    dirColor: "#cde0f0",
    extraLight: null,
  },
  {
    id: "party",
    label: "Fiesta",
    bg: "#14082a",
    swatch: "#14082a",
    ambientInt: 0.15,
    dirInt: 0.3,
    dirColor: "#cc55ff",
    extraLight: { position: [0, 2, 1] as [number, number, number], color: "#ff3890", intensity: 2 },
  },
] as const;

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
      { field: "shoulderWidth" as const, label: "Ancho hombros",  unit: "cm", min: 30, max: 55  },
      { field: "torsoLength"   as const, label: "Largo torso",    unit: "cm", min: 45, max: 75  },
      { field: "bust"          as const, label: "Busto",          unit: "cm", min: 65, max: 130 },
      { field: "waist"         as const, label: "Cintura",        unit: "cm", min: 50, max: 110 },
      { field: "hips"          as const, label: "Cadera",         unit: "cm", min: 65, max: 130 },
    ],
  },
  {
    label: "Brazos",
    sliders: [
      { field: "armLength" as const, label: "Largo brazo",  unit: "cm", min: 50, max: 80 },
      { field: "armGirth"  as const, label: "Cont. bíceps", unit: "cm", min: 18, max: 45 },
    ],
  },
  {
    label: "Piernas",
    sliders: [
      { field: "legLength"  as const, label: "Largo pierna",  unit: "cm", min: 65, max: 105 },
      { field: "thighGirth" as const, label: "Cont. muslo",   unit: "cm", min: 40, max: 80  },
      { field: "calfGirth"  as const, label: "Cont. pantorr.", unit: "cm", min: 25, max: 55 },
    ],
  },
] as const;

const SHOE_SIZES = [35, 36, 37, 38, 39, 40, 41, 42, 43, 44];

interface Props {
  measurements: Measurements;
  onChangeMeasurements: (m: Measurements) => void;
  productId: string | null;
}

function SceneContents({
  measurements,
  scene,
  garmentColor,
  category,
}: {
  measurements: Measurements;
  scene: typeof SCENES[number];
  garmentColor?: string | null;
  category?: string | null;
}) {
  return (
    <>
      <color attach="background" args={[scene.bg]} />
      <ambientLight intensity={scene.ambientInt} />
      <directionalLight
        position={[3, 5, 3]}
        intensity={scene.dirInt}
        color={scene.dirColor}
        castShadow
      />
      {scene.extraLight && (
        <pointLight
          position={scene.extraLight.position}
          color={scene.extraLight.color}
          intensity={scene.extraLight.intensity}
        />
      )}
      <MannequinFigure
        measurements={measurements}
        garmentColor={garmentColor}
        category={category}
      />
      <OrbitControls
        enablePan={false}
        minDistance={1.4}
        maxDistance={5}
        minPolarAngle={Math.PI / 8}
        maxPolarAngle={Math.PI / 1.6}
        target={[0, 0.85, 0]}
      />
    </>
  );
}

export function TryOnViewer({ measurements, onChangeMeasurements, productId }: Props) {
  const [sceneIdx, setSceneIdx] = useState(0);
  const scene = SCENES[sceneIdx];
  const [hovScene, setHovScene] = useState<number | null>(null);

  const { data: product } = useProduct(productId ?? "");

  const garmentColor = product?.color ?? null;
  const category = product?.category ?? null;

  return (
    <div style={{ display: "flex", gap: 20, alignItems: "flex-start" }}>
      {/* ── Canvas 3D ── */}
      <div
        style={{
          flex: "0 0 63%",
          height: 580,
          borderRadius: 12,
          overflow: "hidden",
          border: "1px solid #e4e4e0",
          backgroundColor: scene.bg,
        }}
      >
        <Canvas camera={{ position: [0, 0.9, 2.8], fov: 48 }}>
          <Suspense fallback={null}>
            <SceneContents
              measurements={measurements}
              scene={scene}
              garmentColor={garmentColor}
              category={category}
            />
          </Suspense>
        </Canvas>
      </div>

      {/* ── Panel de controles ── */}
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          gap: 28,
          paddingTop: 4,
        }}
      >
        {/* Selector de escena */}
        <div>
          <p
            style={{
              margin: "0 0 12px",
              fontSize: 9,
              fontWeight: 700,
              letterSpacing: "0.22em",
              textTransform: "uppercase",
              color: "#999",
            }}
          >
            Escena
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            {SCENES.map((s, i) => {
              const active = sceneIdx === i;
              const hov = hovScene === i;
              return (
                <button
                  key={s.id}
                  onClick={() => setSceneIdx(i)}
                  onMouseEnter={() => setHovScene(i)}
                  onMouseLeave={() => setHovScene(null)}
                  style={{
                    padding: "9px 0",
                    fontSize: 9,
                    fontWeight: 700,
                    letterSpacing: "0.16em",
                    textTransform: "uppercase",
                    border: `1px solid ${active ? "#111" : hov ? "#888" : "#e0e0dc"}`,
                    backgroundColor: active ? "#111" : "transparent",
                    color: active ? "#fff" : hov ? "#333" : "#666",
                    borderRadius: 6,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 7,
                    transition: "background-color 0.15s, color 0.15s, border-color 0.15s",
                  }}
                >
                  <span
                    style={{
                      display: "inline-block",
                      width: 10,
                      height: 10,
                      borderRadius: "50%",
                      backgroundColor: s.swatch,
                      border: "1px solid rgba(0,0,0,0.18)",
                      flexShrink: 0,
                    }}
                  />
                  {s.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Sliders de medidas — agrupados por zona corporal */}
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          {SLIDER_GROUPS.map((group) => (
            <div key={group.label}>
              <p
                style={{
                  margin: "0 0 10px",
                  fontSize: 8,
                  fontWeight: 700,
                  letterSpacing: "0.22em",
                  textTransform: "uppercase",
                  color: "#bbb",
                  borderBottom: "1px solid #f0f0ee",
                  paddingBottom: 5,
                }}
              >
                {group.label}
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: 13 }}>
                {group.sliders.map(({ field, label, unit, min, max }) => (
                  <div key={field}>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "baseline",
                        marginBottom: 4,
                      }}
                    >
                      <span style={{ fontSize: 10, color: "#555" }}>{label}</span>
                      <span style={{ fontSize: 10, fontWeight: 600, color: "#111" }}>
                        {measurements[field]}{" "}
                        <span style={{ fontSize: 8, fontWeight: 400, color: "#aaa" }}>{unit}</span>
                      </span>
                    </div>
                    <input
                      type="range"
                      min={min}
                      max={max}
                      value={measurements[field]}
                      onChange={(e) =>
                        onChangeMeasurements({ ...measurements, [field]: Number(e.target.value) })
                      }
                      style={{ width: "100%", accentColor: "#111", cursor: "pointer" }}
                    />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Prenda seleccionada */}
        {product ? (
          <div
            style={{
              border: "1px solid #e8e8e8",
              borderRadius: 8,
              padding: "14px 16px",
            }}
          >
            <p
              style={{
                margin: "0 0 10px",
                fontSize: 9,
                fontWeight: 700,
                letterSpacing: "0.22em",
                textTransform: "uppercase",
                color: "#999",
              }}
            >
              Prenda seleccionada
            </p>
            <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
              {product.image_urls[0] && (
                <img
                  src={product.image_urls[0]}
                  alt={product.name}
                  style={{
                    width: 50,
                    height: 66,
                    objectFit: "cover",
                    borderRadius: 4,
                    flexShrink: 0,
                  }}
                />
              )}
              <div>
                {product.brand && (
                  <p
                    style={{
                      margin: "0 0 2px",
                      fontSize: 9,
                      color: "#bbb",
                      letterSpacing: "0.16em",
                      textTransform: "uppercase",
                    }}
                  >
                    {product.brand}
                  </p>
                )}
                <p style={{ margin: "0 0 4px", fontSize: 12, color: "#111", fontWeight: 500 }}>
                  {product.name}
                </p>
                <p style={{ margin: "0 0 4px", fontSize: 10, color: "#888" }}>
                  {product.category}
                  {product.color ? ` · ${product.color}` : ""}
                </p>
                <p style={{ margin: 0, fontSize: 12, fontWeight: 600, color: "#111" }}>
                  {formatCLP(product.price)}
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div
            style={{
              border: "1px dashed #e0e0dc",
              borderRadius: 8,
              padding: "20px 16px",
              textAlign: "center",
              color: "#bbb",
              fontSize: 11,
              lineHeight: 1.7,
            }}
          >
            Sin prenda seleccionada.{" "}
            <a href="/marketplace" style={{ color: "#555", textDecoration: "underline" }}>
              Explorar catálogo
            </a>
          </div>
        )}

        {/* Talla de pie */}
        <div>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "baseline",
              marginBottom: 10,
            }}
          >
            <p
              style={{
                margin: 0,
                fontSize: 9,
                fontWeight: 700,
                letterSpacing: "0.22em",
                textTransform: "uppercase",
                color: "#999",
              }}
            >
              Talla de pie
            </p>
            <span style={{ fontSize: 11, fontWeight: 600, color: "#111" }}>
              {measurements.shoeSize}{" "}
              <span style={{ fontSize: 9, fontWeight: 400, color: "#aaa" }}>EU</span>
            </span>
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
            {SHOE_SIZES.map((size) => {
              const active = measurements.shoeSize === size;
              return (
                <button
                  key={size}
                  onClick={() => onChangeMeasurements({ ...measurements, shoeSize: size })}
                  style={{
                    width: 36,
                    height: 32,
                    fontSize: 10,
                    fontWeight: active ? 700 : 400,
                    border: `1px solid ${active ? "#111" : "#e0e0dc"}`,
                    backgroundColor: active ? "#111" : "#fff",
                    color: active ? "#fff" : "#666",
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

        {/* Hint de interacción */}
        <p
          style={{
            margin: 0,
            fontSize: 10,
            color: "#ccc",
            textAlign: "center",
            lineHeight: 1.6,
          }}
        >
          Arrastra para girar · Scroll para zoom
        </p>
      </div>
    </div>
  );
}
