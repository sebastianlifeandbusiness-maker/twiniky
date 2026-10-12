"use client";

import { Suspense, useState, useEffect, useMemo, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, useGLTF } from "@react-three/drei";
import * as THREE from "three";
import { clone as cloneSkeleton } from "three/examples/jsm/utils/SkeletonUtils.js";
import type { Group } from "three";
import { MannequinFigure } from "./MannequinFigure";
import { AvatarModel } from "./AvatarModel";
import { GarmentOverlay, resolveColor } from "./GarmentOverlay";
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
import { avatarApi, apiToMeasurements, getBackendOrigin, tryonSelectionsApi, brandTryonSelectionsApi, tryonApi } from "@/lib/api";
import { useAuthStore } from "@/lib/store/auth";
import { useBrandStore } from "@/lib/store/brand";
import { useCartStore } from "@/lib/store/cart";
import type { Measurements } from "@/types";

const SCENES = [
  {
    id: "studio",
    label: "Estudio",
    imgPath: "/scenes/studio.jpg",
    bg: "#f0eee9",
    swatch: "#f0eee9",
  },
  {
    id: "office",
    label: "Oficina",
    imgPath: "/scenes/office.jpg",
    bg: "#e6e0d2",
    swatch: "#e6e0d2",
  },
  {
    id: "street",
    label: "Calle",
    imgPath: "/scenes/street.jpg",
    bg: "#b0bec8",
    swatch: "#b0bec8",
  },
  {
    id: "party",
    label: "Fiesta",
    imgPath: "/scenes/party.jpg",
    bg: "#14082a",
    swatch: "#14082a",
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

const AUTO_ROTATE_SPEED = 0.003; // rad/frame
const AUTO_ROTATE_RESUME_MS = 3000; // retoma la rotación 3s después de soltar el drag

// Hardcoded mientras solo existe un modelo 3D de prenda (polera).
// Ya viene posicionada para el avatar real (torso, pies en y=0, altura ~1.74m).
const TSHIRT_GLB_URL = "http://localhost:8000/uploads/avatars/tshirt_3d.glb";

function GarmentGLB({ url, color }: { url: string; color: string }) {
  const { scene } = useGLTF(url);
  const cloned = useMemo(() => cloneSkeleton(scene), [scene]);

  useEffect(() => {
    cloned.traverse((obj) => {
      if ((obj as THREE.Mesh).isMesh) {
        (obj as THREE.Mesh).material = new THREE.MeshStandardMaterial({
          color: new THREE.Color(color),
          roughness: 0.7,
          metalness: 0.0,
          transparent: true,
          opacity: 0.95,
          side: THREE.DoubleSide,
        });
      }
    });
  }, [cloned, color]);

  return <primitive object={cloned} />;
}

useGLTF.preload(TSHIRT_GLB_URL);

function AutoRotatingGroup({
  pausedRef,
  children,
}: {
  pausedRef: React.MutableRefObject<boolean>;
  children: React.ReactNode;
}) {
  const groupRef = useRef<Group>(null);
  useFrame(() => {
    if (groupRef.current && !pausedRef.current) {
      groupRef.current.rotation.y += AUTO_ROTATE_SPEED;
    }
  });
  return <group ref={groupRef}>{children}</group>;
}

function SceneContents({
  measurements,
  garmentList,
  glbUrl,
  autoRotatePausedRef,
  onOrbitStart,
  onOrbitEnd,
}: {
  measurements: Measurements;
  garmentList: Array<{ zoneId: ZoneId; category: string; effectiveColor: string | null }>;
  glbUrl: string | null;
  autoRotatePausedRef: React.MutableRefObject<boolean>;
  onOrbitStart: () => void;
  onOrbitEnd: () => void;
}) {
  return (
    <>
      <ambientLight intensity={1.2} color="#ffffff" />
      <directionalLight
        position={[5, 10, 5]}
        intensity={1.5}
        color="#ffffff"
        castShadow
      />
      <directionalLight
        position={[0, 5, 5]}
        intensity={0.8}
        color="#ffffff"
      />
      <pointLight position={[0, -2, 3]} intensity={0.3} color="#ffffff" />
      <AutoRotatingGroup pausedRef={autoRotatePausedRef}>
        {glbUrl ? <AvatarModel url={glbUrl} /> : (
          <MannequinFigure measurements={measurements} skinTone={measurements.skinTone} />
        )}
        {garmentList.map((g, i) =>
          g.zoneId === "upper" ? (
            <GarmentGLB key={i} url={TSHIRT_GLB_URL} color={resolveColor(g.effectiveColor)} />
          ) : (
            <GarmentOverlay
              key={i}
              measurements={measurements}
              garmentColor={g.effectiveColor}
              category={g.category}
            />
          )
        )}
      </AutoRotatingGroup>
      <OrbitControls
        enablePan={false}
        minDistance={1.4}
        maxDistance={5}
        minPolarAngle={Math.PI / 8}
        maxPolarAngle={Math.PI / 1.6}
        target={[0, 0.85, 0]}
        onStart={onOrbitStart}
        onEnd={onOrbitEnd}
      />
    </>
  );
}

export function TryOnViewer({ measurements: initialMeasurements, onChangeMeasurements: _onChangeMeasurements, productId }: Props) {
  const [sceneIdx, setSceneIdx] = useState(0);
  const scene = SCENES[sceneIdx];
  const [hovScene, setHovScene] = useState<number | null>(null);
  const [measurements, setMeasurements] = useState<Measurements>(initialMeasurements);
  const [glbUrl, setGlbUrl] = useState<string | null>(null);
  const [hasSelfiePhoto, setHasSelfiePhoto] = useState(false);
  const [tryonOpen, setTryonOpen] = useState(false);
  const [tryonLoading, setTryonLoading] = useState(false);
  const [tryonError, setTryonError] = useState<string | null>(null);
  const [tryonResult, setTryonResult] = useState<string | null>(null);

  const autoRotatePausedRef = useRef(false);
  const resumeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function handleOrbitStart() {
    autoRotatePausedRef.current = true;
    if (resumeTimeoutRef.current) clearTimeout(resumeTimeoutRef.current);
  }

  function handleOrbitEnd() {
    if (resumeTimeoutRef.current) clearTimeout(resumeTimeoutRef.current);
    resumeTimeoutRef.current = setTimeout(() => {
      autoRotatePausedRef.current = false;
    }, AUTO_ROTATE_RESUME_MS);
  }

  const { token } = useAuthStore();
  const { brand: brandSession, token: brandToken } = useBrandStore();
  const { garments, setGarment, removeGarment, setOverrideColor, loadFromServer } = useTryOnStore();

  // Carga medidas desde API al montar (override de las medidas iniciales)
  useEffect(() => {
    if (!token) return;
    avatarApi.get()
      .then(({ data }) => {
        setMeasurements(apiToMeasurements(data));
        if (data.avatar_glb_url) {
          const version = data.updated_at ? encodeURIComponent(data.updated_at) : Date.now();
          setGlbUrl(`${getBackendOrigin()}${data.avatar_glb_url}?v=${version}`);
        } else {
          setGlbUrl(null);
        }
        setHasSelfiePhoto(!!data.selfie_photo_url);
      })
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
    .map((z) => {
      const g = garments[z.id];
      if (!g) return null;
      return { zoneId: z.id, category: g.category, effectiveColor: g.overrideColor ?? g.color };
    })
    .filter((g): g is { zoneId: ZoneId; category: string; effectiveColor: string | null } => g !== null);

  const activeZonesWithGarments = ZONES.filter((z) => garments[z.id] !== undefined);
  const firstGarment = activeZonesWithGarments[0] ? garments[activeZonesWithGarments[0].id] : undefined;

  const { addItem } = useCartStore();
  const { data: tryonProduct } = useProduct(firstGarment?.productId ?? "");

  function closeTryOn() {
    setTryonOpen(false);
    setTryonResult(null);
    setTryonError(null);
  }

  async function handleVirtualTryOn() {
    if (!firstGarment) return;

    setTryonOpen(true);
    setTryonResult(null);

    if (!hasSelfiePhoto) {
      setTryonError("Sube tu foto en Configurar Avatar para usar esta función.");
      return;
    }

    setTryonError(null);
    setTryonLoading(true);
    try {
      const { data } = await tryonApi.virtualTryOn(firstGarment.productId);
      setTryonResult(data.image_base64);
    } catch (err) {
      const detail =
        (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
      setTryonError(detail || "No se pudo generar la prueba virtual. Intenta de nuevo.");
    } finally {
      setTryonLoading(false);
    }
  }

  function handleAddToCartFromTryOn() {
    if (tryonProduct) addItem(tryonProduct, null);
    closeTryOn();
  }

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
          backgroundImage: `url(${scene.imgPath})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <Canvas camera={{ position: [0, 0.9, 2.8], fov: 48 }} gl={{ alpha: true }}>
          <Suspense fallback={null}>
            <SceneContents
              measurements={measurements}
              garmentList={garmentList}
              glbUrl={glbUrl}
              autoRotatePausedRef={autoRotatePausedRef}
              onOrbitStart={handleOrbitStart}
              onOrbitEnd={handleOrbitEnd}
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

        {/* Ver cómo me queda (IDM-VTON) */}
        {firstGarment && (
          <button
            onClick={handleVirtualTryOn}
            style={{
              padding: "10px 0",
              fontSize: 9,
              fontWeight: 700,
              letterSpacing: "0.16em",
              textTransform: "uppercase",
              border: "none",
              borderRadius: 6,
              backgroundColor: "#111",
              color: "#fff",
              cursor: "pointer",
            }}
          >
            Ver cómo me queda
          </button>
        )}

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

      {/* ── Modal: prueba virtual (IDM-VTON) ── */}
      {tryonOpen && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(0,0,0,0.55)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
          }}
          onClick={closeTryOn}
        >
          <div
            style={{
              backgroundColor: "#fff",
              borderRadius: 12,
              padding: "28px 28px 24px",
              maxWidth: 420,
              width: "90%",
              boxShadow: "0 20px 60px rgba(0,0,0,0.18)",
              textAlign: "center",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {tryonLoading && (
              <>
                <div
                  style={{
                    width: 32,
                    height: 32,
                    margin: "8px auto 18px",
                    border: "3px solid #eee",
                    borderTopColor: "#111",
                    borderRadius: "50%",
                    animation: "twiniky-spin 0.8s linear infinite",
                  }}
                />
                <style>{`@keyframes twiniky-spin { to { transform: rotate(360deg); } }`}</style>
                <p style={{ margin: 0, fontSize: 13, color: "#555" }}>
                  Generando tu prueba virtual…
                </p>
                <p style={{ margin: "6px 0 0", fontSize: 11, color: "#aaa" }}>
                  Esto puede tardar unos 26 segundos.
                </p>
              </>
            )}

            {!tryonLoading && tryonError && (
              <>
                <p style={{ margin: "0 0 20px", fontSize: 13, color: "#555", lineHeight: 1.6 }}>
                  {tryonError}
                </p>
                <div style={{ display: "flex", gap: 10 }}>
                  {!hasSelfiePhoto && (
                    <Link
                      href="/avatar/setup"
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
                        textDecoration: "none",
                      }}
                    >
                      Configurar avatar
                    </Link>
                  )}
                  <button
                    onClick={closeTryOn}
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
                    Cerrar
                  </button>
                </div>
              </>
            )}

            {!tryonLoading && !tryonError && tryonResult && (
              <>
                <img
                  src={`data:image/png;base64,${tryonResult}`}
                  alt="Prueba virtual"
                  style={{
                    width: "100%",
                    maxHeight: 480,
                    objectFit: "contain",
                    borderRadius: 8,
                    marginBottom: 18,
                    backgroundColor: "#fafaf8",
                  }}
                />
                <div style={{ display: "flex", gap: 10 }}>
                  <button
                    onClick={handleAddToCartFromTryOn}
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
                    Agregar al carrito
                  </button>
                  <button
                    onClick={closeTryOn}
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
                    Cerrar
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
