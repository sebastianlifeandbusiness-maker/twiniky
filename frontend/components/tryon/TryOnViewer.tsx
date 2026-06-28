"use client";

import { Suspense, useState, useEffect, useRef } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { MannequinFigure } from "./MannequinFigure";
import { GarmentOverlay } from "./GarmentOverlay";
import { useProduct } from "@/lib/hooks/useProducts";
import { formatCLP } from "@/lib/utils/format";
import Link from "next/link";
import {
  useTryOnStore,
  ZONES,
  getZoneForCategory,
  type ZoneId,
  type ZoneGarment,
} from "@/lib/store/tryon";
import { avatarApi, apiToMeasurements, tryonSelectionsApi, brandTryonSelectionsApi } from "@/lib/api";
import { useAuthStore } from "@/lib/store/auth";
import { useBrandStore } from "@/lib/store/brand";
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

const COLOR_SWATCHES = [
  { label: "Blanco",     hex: "#f5f5f3" },
  { label: "Negro",      hex: "#111111" },
  { label: "Gris",       hex: "#888888" },
  { label: "Azul marino",hex: "#0a1e60" },
  { label: "Rojo",       hex: "#cc2200" },
  { label: "Verde",      hex: "#2a8840" },
  { label: "Beige",      hex: "#d4c5a9" },
  { label: "Rosa",       hex: "#e8789a" },
  { label: "Amarillo",   hex: "#e8c018" },
  { label: "Naranja",    hex: "#e86518" },
];

interface Props {
  measurements: Measurements;
  onChangeMeasurements: (m: Measurements) => void;
  productId: string | null;
}

function SceneContents({
  measurements,
  scene,
  garmentList,
}: {
  measurements: Measurements;
  scene: (typeof SCENES)[number];
  garmentList: Array<{ category: string; effectiveColor: string | null }>;
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
      <MannequinFigure measurements={measurements} />
      {garmentList.map((g, i) => (
        <GarmentOverlay
          key={i}
          measurements={measurements}
          garmentColor={g.effectiveColor}
          category={g.category}
        />
      ))}
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

export function TryOnViewer({ measurements: initialMeasurements, onChangeMeasurements: _onChangeMeasurements, productId }: Props) {
  const [sceneIdx, setSceneIdx] = useState(0);
  const scene = SCENES[sceneIdx];
  const [hovScene, setHovScene] = useState<number | null>(null);
  const [measurements, setMeasurements] = useState<Measurements>(initialMeasurements);

  const { token } = useAuthStore();
  const { brand: brandSession, token: brandToken } = useBrandStore();
  const { garments, setGarment, removeGarment, setOverrideColor, loadFromServer } = useTryOnStore();

  // Carga medidas desde API al montar (override de las medidas iniciales)
  useEffect(() => {
    if (!token) return;
    avatarApi.get()
      .then(({ data }) => setMeasurements(apiToMeasurements(data)))
      .catch(() => {});
  }, [token]);

  // Carga selecciones guardadas al montar (buyer o marca)
  useEffect(() => {
    if (token) {
      tryonSelectionsApi.getSelections()
        .then(({ data }) => loadFromServer(data))
        .catch(() => {});
    } else if (brandToken) {
      brandTryonSelectionsApi.getSelections()
        .then(({ data }) => loadFromServer(data))
        .catch(() => {});
    }
  }, [token, brandToken]);

  const { data: product } = useProduct(productId ?? "");
  const processedRef = useRef<string | null>(null);

  const [conflictDialog, setConflictDialog] = useState<{
    zoneId: ZoneId;
    existing: ZoneGarment;
    incoming: ZoneGarment;
  } | null>(null);

  useEffect(() => {
    if (!productId || !product || processedRef.current === productId) return;
    processedRef.current = productId;

    const zoneId = getZoneForCategory(product.category);
    if (!zoneId) return;

    const incoming: ZoneGarment = {
      productId: product.id,
      name: product.name,
      brand: product.brand,
      imageUrl: product.image_urls[0] ?? "",
      category: product.category,
      color: product.color,
      price: product.price,
      overrideColor: null,
    };

    const { garments: currentGarments } = useTryOnStore.getState();
    const existing = currentGarments[zoneId];
    if (existing && existing.productId !== productId) {
      setConflictDialog({ zoneId, existing, incoming });
    } else {
      setGarment(zoneId, incoming);
    }
  }, [product, productId, setGarment]);

  const garmentList = ZONES
    .map((z) => garments[z.id])
    .filter((g): g is ZoneGarment => g !== undefined)
    .map((g) => ({
      category: g.category,
      effectiveColor: g.overrideColor ?? g.color,
    }));

  const activeZonesWithGarments = ZONES.filter((z) => garments[z.id] !== undefined);

  return (
    <div style={{ display: "flex", gap: 16, alignItems: "flex-start" }}>

      {/* ── Panel izquierdo: zonas de prendas ── */}
      <div style={{ flex: "0 0 170px", display: "flex", flexDirection: "column", gap: 8 }}>
        <p
          style={{
            margin: "0 0 4px",
            fontSize: 9,
            fontWeight: 700,
            letterSpacing: "0.22em",
            textTransform: "uppercase",
            color: "#999",
          }}
        >
          Prendas
        </p>
        {ZONES.map((zone) => {
          const garment = garments[zone.id];
          return (
            <div
              key={zone.id}
              style={{
                border: `1px solid ${garment ? "#111" : "#e4e4e0"}`,
                borderRadius: 8,
                overflow: "hidden",
                backgroundColor: "#fafaf8",
              }}
            >
              {garment ? (
                <div style={{ position: "relative", padding: "10px" }}>
                  <button
                    onClick={() => removeGarment(zone.id)}
                    title="Quitar prenda"
                    style={{
                      position: "absolute",
                      top: 4,
                      right: 4,
                      width: 18,
                      height: 18,
                      border: "none",
                      background: "#ebebea",
                      borderRadius: "50%",
                      cursor: "pointer",
                      fontSize: 12,
                      color: "#666",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      lineHeight: 1,
                      padding: 0,
                    }}
                  >
                    ×
                  </button>
                  <p
                    style={{
                      margin: "0 0 6px",
                      fontSize: 7,
                      fontWeight: 700,
                      letterSpacing: "0.18em",
                      textTransform: "uppercase",
                      color: "#aaa",
                    }}
                  >
                    {zone.label}
                  </p>
                  <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    {garment.imageUrl && (
                      <img
                        src={garment.imageUrl}
                        alt={garment.name}
                        style={{
                          width: 36,
                          height: 48,
                          objectFit: "cover",
                          borderRadius: 3,
                          flexShrink: 0,
                        }}
                      />
                    )}
                    <div style={{ minWidth: 0 }}>
                      <p
                        style={{
                          margin: 0,
                          fontSize: 9,
                          color: "#111",
                          fontWeight: 500,
                          lineHeight: 1.35,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {garment.name}
                      </p>
                      <p style={{ margin: "3px 0 0", fontSize: 8, color: "#999" }}>
                        {formatCLP(garment.price)}
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <a
                  href={
                    brandToken && brandSession
                      ? `/marketplace?category=${zone.primaryCategory}&brand_id=${brandSession.id}`
                      : `/marketplace?category=${zone.primaryCategory}`
                  }
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: "14px 10px",
                    textDecoration: "none",
                    minHeight: 76,
                  }}
                >
                  <span style={{ fontSize: 22, color: "#d0d0cc", lineHeight: 1, marginBottom: 5 }}>
                    +
                  </span>
                  <p
                    style={{
                      margin: 0,
                      fontSize: 7,
                      fontWeight: 700,
                      letterSpacing: "0.18em",
                      textTransform: "uppercase",
                      color: "#bbb",
                      textAlign: "center",
                    }}
                  >
                    {zone.label}
                  </p>
                  <p
                    style={{
                      margin: "3px 0 0",
                      fontSize: 7,
                      color: "#ccc",
                      textAlign: "center",
                      lineHeight: 1.4,
                    }}
                  >
                    {zone.hint}
                  </p>
                </a>
              )}
            </div>
          );
        })}
      </div>

      {/* ── Canvas 3D ── */}
      <div
        style={{
          flex: 1,
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
              garmentList={garmentList}
            />
          </Suspense>
        </Canvas>
      </div>

      {/* ── Panel derecho: escenas + colores ── */}
      <div
        style={{
          flex: "0 0 200px",
          display: "flex",
          flexDirection: "column",
          gap: 24,
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

        {/* Editar avatar */}
        <Link
          href="/avatar/setup"
          style={{
            display: "block",
            padding: "9px 0",
            fontSize: 9,
            fontWeight: 700,
            letterSpacing: "0.16em",
            textTransform: "uppercase",
            textAlign: "center",
            border: "1px solid #e0e0dc",
            borderRadius: 6,
            color: "#666",
            textDecoration: "none",
            transition: "border-color 0.15s, color 0.15s",
          }}
        >
          Editar avatar
        </Link>

        {/* Selector de color por zona activa */}
        {activeZonesWithGarments.map((zone) => {
          const garment = garments[zone.id]!;
          const activeHex = garment.overrideColor;
          return (
            <div key={zone.id}>
              <p
                style={{
                  margin: "0 0 8px",
                  fontSize: 9,
                  fontWeight: 700,
                  letterSpacing: "0.18em",
                  textTransform: "uppercase",
                  color: "#999",
                }}
              >
                Color · {zone.label}
              </p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {COLOR_SWATCHES.map((sw) => {
                  const isActive = activeHex === sw.hex;
                  return (
                    <button
                      key={sw.hex}
                      title={sw.label}
                      onClick={() => setOverrideColor(zone.id, sw.hex)}
                      style={{
                        width: 22,
                        height: 22,
                        borderRadius: "50%",
                        backgroundColor: sw.hex,
                        border: isActive
                          ? "2px solid #111"
                          : sw.hex === "#f5f5f3"
                          ? "1px solid #ddd"
                          : "1px solid transparent",
                        cursor: "pointer",
                        padding: 0,
                        boxShadow: isActive ? "0 0 0 2px #fff, 0 0 0 4px #111" : "none",
                        transition: "box-shadow 0.1s",
                      }}
                    />
                  );
                })}
              </div>
            </div>
          );
        })}

        {activeZonesWithGarments.length === 0 && (
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
            Sin prendas seleccionadas.{" "}
            <a href="/marketplace" style={{ color: "#555", textDecoration: "underline" }}>
              Explorar catálogo
            </a>
          </div>
        )}

        <p
          style={{
            margin: "auto 0 0",
            fontSize: 10,
            color: "#ccc",
            textAlign: "center",
            lineHeight: 1.6,
          }}
        >
          Arrastra para girar · Scroll para zoom
        </p>
      </div>

      {/* ── Diálogo de conflicto de zona ── */}
      {conflictDialog && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(0,0,0,0.45)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
          }}
          onClick={() => setConflictDialog(null)}
        >
          <div
            style={{
              backgroundColor: "#fff",
              borderRadius: 12,
              padding: "28px 28px 24px",
              maxWidth: 380,
              width: "90%",
              boxShadow: "0 20px 60px rgba(0,0,0,0.18)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <p
              style={{
                margin: "0 0 10px",
                fontSize: 14,
                fontWeight: 600,
                color: "#111",
              }}
            >
              Reemplazar prenda
            </p>
            <p
              style={{
                margin: "0 0 22px",
                fontSize: 12,
                color: "#555",
                lineHeight: 1.65,
              }}
            >
              Ya tienes <strong>{conflictDialog.existing.name}</strong> seleccionada.
              ¿Quieres reemplazarla con <strong>{conflictDialog.incoming.name}</strong>?
            </p>
            <div style={{ display: "flex", gap: 10 }}>
              <button
                onClick={() => {
                  setGarment(conflictDialog.zoneId, conflictDialog.incoming);
                  setConflictDialog(null);
                }}
                style={{
                  flex: 1,
                  padding: "10px 0",
                  fontSize: 11,
                  fontWeight: 700,
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                  backgroundColor: "#111",
                  color: "#fff",
                  border: "none",
                  borderRadius: 6,
                  cursor: "pointer",
                }}
              >
                Sí, reemplazar
              </button>
              <button
                onClick={() => setConflictDialog(null)}
                style={{
                  flex: 1,
                  padding: "10px 0",
                  fontSize: 11,
                  fontWeight: 700,
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                  backgroundColor: "#f0f0ee",
                  color: "#333",
                  border: "none",
                  borderRadius: 6,
                  cursor: "pointer",
                }}
              >
                No
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
