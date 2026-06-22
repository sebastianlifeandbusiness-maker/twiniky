"use client";

import type { Measurements } from "@/types";

// ── Color resolver ─────────────────────────────────────────────────────────────
const ES_COLORS: Record<string, string> = {
  negro: "#111111",    blanco: "#f5f5f3",    gris: "#888888",
  "gris claro": "#c8c8c8", "gris oscuro": "#444444",
  rojo: "#cc2200",     rosa: "#e8789a",       rosado: "#e8789a",
  fucsia: "#d81b60",   naranja: "#e86518",    amarillo: "#e8c018",
  "amarillo mostaza": "#c8960a",
  azul: "#1a5cb8",     "azul marino": "#0a1e60", "azul cielo": "#4a9adc",
  celeste: "#72b8e8",  verde: "#2a8840",      "verde menta": "#60c890",
  "verde militar": "#4a6030", turquesa: "#20a8a0",
  beige: "#d4c5a9",   crema: "#f0e8d0",      camel: "#c89050",
  café: "#8b5e3c",    marrón: "#8b5e3c",     terracota: "#c85840",
  morado: "#7830b8",  violeta: "#6820b8",    lila: "#c8a0dc",
  lavanda: "#d8c0e8", plateado: "#c0c0c0",   dorado: "#d4a820",
};

function resolveColor(raw: string | null | undefined): string {
  if (!raw) return "#6b8cba"; // azul neutro visible contra todos los fondos de escena
  return ES_COLORS[raw.toLowerCase().trim()] ?? raw;
}

// ── Constantes de geometría (deben coincidir con MannequinFigure) ─────────────
const BASE = {
  height: 165, bust: 88, waist: 68, hips: 94, armLength: 58,
  shoulderWidth: 40, torsoLength: 61, legLength: 85,
  armGirth: 28, thighGirth: 55, calfGirth: 36,
};
const TORSO_TOP_Y   = 1.30;
const UPPER_TORSO_H = 0.30;
const LOWER_TORSO_H = 0.20;
const PELVIS_H      = 0.13;
const SHOULDER_Y    = 1.36;
const UPPER_ARM_H   = 0.28;
const FOREARM_H     = 0.24;
const ARM_ANGLE     = Math.PI / 18;
const THIGH_H       = 0.29;
const CALF_H        = 0.27;
const CALF_CENTER_OFFSET = 0.46;
const CALF_BOTTOM_OFFSET = CALF_CENTER_OFFSET + CALF_H / 2; // 0.595
const FOOT_H        = 0.05;
const ANKLE_GAP     = 0.025;
const SKIRT_H       = 0.22;

// Expansión X/Z: la prenda es un 7% más ancha que el cuerpo para evitar z-fighting
const OFF = 1.07;

interface Props {
  measurements: Measurements;
  garmentColor: string | null;
  category: string | null;
}

export function GarmentOverlay({ measurements, garmentColor, category }: Props) {
  if (!category) return null;
  // Accesorios sin color se omiten (sin zona corporal clara para mostrar)
  if (category === "Accesorios" && !garmentColor) return null;

  const color = resolveColor(garmentColor);

  const hScale   = measurements.height        / BASE.height;
  const bScale   = measurements.bust          / BASE.bust;
  const wScale   = measurements.waist         / BASE.waist;
  const hipScale = measurements.hips          / BASE.hips;
  const aScale   = measurements.armLength     / BASE.armLength;
  const shwScale = measurements.shoulderWidth / BASE.shoulderWidth;
  const tlScale  = measurements.torsoLength   / BASE.torsoLength;
  const llScale  = measurements.legLength     / BASE.legLength;
  const agScale  = measurements.armGirth      / BASE.armGirth;
  const tgScale  = measurements.thighGirth    / BASE.thighGirth;
  const cgScale  = measurements.calfGirth     / BASE.calfGirth;

  const upperTorsoY = TORSO_TOP_Y - (UPPER_TORSO_H * tlScale) / 2;
  const lowerTorsoY = TORSO_TOP_Y - UPPER_TORSO_H * tlScale - (LOWER_TORSO_H * tlScale) / 2;
  const pelvisY     = TORSO_TOP_Y - (UPPER_TORSO_H + LOWER_TORSO_H) * tlScale - (PELVIS_H * tlScale) / 2;
  const HIP_JOINT_Y = TORSO_TOP_Y - (UPPER_TORSO_H + LOWER_TORSO_H + PELVIS_H) * tlScale;
  const armX        = 0.22 * shwScale;
  const thighY      = HIP_JOINT_Y - (THIGH_H * llScale) / 2;
  const calfY       = HIP_JOINT_Y - CALF_CENTER_OFFSET * llScale;
  const footY       = HIP_JOINT_Y - CALF_BOTTOM_OFFSET * llScale - ANKLE_GAP - FOOT_H / 2;
  const skirtCenterY = HIP_JOINT_Y - (SKIRT_H * llScale) / 2;

  // ── Tops ──────────────────────────────────────────────────────────────────────
  if (category === "Tops") {
    return (
      <group scale={[1, hScale, 1]}>
        {/* Hombros */}
        <mesh position={[0, 1.32, 0]} scale={[shwScale * OFF, 1.02, OFF]}>
          <boxGeometry args={[0.44, 0.075, 0.21]} />
          <meshStandardMaterial color={color} roughness={0.88} metalness={0} />
        </mesh>
        {/* Torso superior */}
        <mesh position={[0, upperTorsoY, 0]} scale={[bScale * OFF, tlScale, (bScale * 0.6 + 0.4) * OFF]}>
          <cylinderGeometry args={[0.155, 0.112, UPPER_TORSO_H, 10]} />
          <meshStandardMaterial color={color} roughness={0.88} metalness={0} />
        </mesh>
        {/* Brazo superior izquierdo */}
        <group position={[-armX, SHOULDER_Y, 0]} rotation={[0, 0, -ARM_ANGLE]}>
          <mesh position={[0, -(UPPER_ARM_H * aScale) / 2, 0]} scale={[agScale * OFF, aScale, agScale * OFF]}>
            <cylinderGeometry args={[0.065, 0.052, UPPER_ARM_H, 8]} />
            <meshStandardMaterial color={color} roughness={0.88} metalness={0} />
          </mesh>
        </group>
        {/* Brazo superior derecho */}
        <group position={[armX, SHOULDER_Y, 0]} rotation={[0, 0, ARM_ANGLE]}>
          <mesh position={[0, -(UPPER_ARM_H * aScale) / 2, 0]} scale={[agScale * OFF, aScale, agScale * OFF]}>
            <cylinderGeometry args={[0.065, 0.052, UPPER_ARM_H, 8]} />
            <meshStandardMaterial color={color} roughness={0.88} metalness={0} />
          </mesh>
        </group>
      </group>
    );
  }

  // ── Chaquetas ─────────────────────────────────────────────────────────────────
  if (category === "Chaquetas") {
    return (
      <group scale={[1, hScale, 1]}>
        {/* Hombros */}
        <mesh position={[0, 1.32, 0]} scale={[shwScale * OFF, 1.02, OFF]}>
          <boxGeometry args={[0.44, 0.075, 0.21]} />
          <meshStandardMaterial color={color} roughness={0.88} metalness={0} />
        </mesh>
        {/* Torso superior */}
        <mesh position={[0, upperTorsoY, 0]} scale={[bScale * OFF, tlScale, (bScale * 0.6 + 0.4) * OFF]}>
          <cylinderGeometry args={[0.155, 0.112, UPPER_TORSO_H, 10]} />
          <meshStandardMaterial color={color} roughness={0.88} metalness={0} />
        </mesh>
        {/* Brazo completo izquierdo */}
        <group position={[-armX, SHOULDER_Y, 0]} rotation={[0, 0, -ARM_ANGLE]}>
          <mesh position={[0, -(UPPER_ARM_H * aScale) / 2, 0]} scale={[agScale * OFF, aScale, agScale * OFF]}>
            <cylinderGeometry args={[0.065, 0.052, UPPER_ARM_H, 8]} />
            <meshStandardMaterial color={color} roughness={0.88} metalness={0} />
          </mesh>
          <mesh position={[0, -UPPER_ARM_H * aScale - (FOREARM_H * aScale) / 2, 0]} scale={[agScale * OFF, aScale, agScale * OFF]}>
            <cylinderGeometry args={[0.050, 0.034, FOREARM_H, 8]} />
            <meshStandardMaterial color={color} roughness={0.88} metalness={0} />
          </mesh>
        </group>
        {/* Brazo completo derecho */}
        <group position={[armX, SHOULDER_Y, 0]} rotation={[0, 0, ARM_ANGLE]}>
          <mesh position={[0, -(UPPER_ARM_H * aScale) / 2, 0]} scale={[agScale * OFF, aScale, agScale * OFF]}>
            <cylinderGeometry args={[0.065, 0.052, UPPER_ARM_H, 8]} />
            <meshStandardMaterial color={color} roughness={0.88} metalness={0} />
          </mesh>
          <mesh position={[0, -UPPER_ARM_H * aScale - (FOREARM_H * aScale) / 2, 0]} scale={[agScale * OFF, aScale, agScale * OFF]}>
            <cylinderGeometry args={[0.050, 0.034, FOREARM_H, 8]} />
            <meshStandardMaterial color={color} roughness={0.88} metalness={0} />
          </mesh>
        </group>
      </group>
    );
  }

  // ── Pantalones ────────────────────────────────────────────────────────────────
  if (category === "Pantalones") {
    return (
      <group scale={[1, hScale, 1]}>
        {/* Cintura */}
        <mesh position={[0, lowerTorsoY, 0]} scale={[wScale * OFF, tlScale, (wScale * 0.6 + 0.4) * OFF]}>
          <cylinderGeometry args={[0.112, 0.135, LOWER_TORSO_H, 10]} />
          <meshStandardMaterial color={color} roughness={0.88} metalness={0} />
        </mesh>
        {/* Pelvis */}
        <mesh position={[0, pelvisY, 0]} scale={[hipScale * OFF, tlScale, (hipScale * 0.65 + 0.35) * OFF]}>
          <cylinderGeometry args={[0.148, 0.142, PELVIS_H, 10]} />
          <meshStandardMaterial color={color} roughness={0.88} metalness={0} />
        </mesh>
        {/* Muslo izquierdo */}
        <mesh position={[-0.09, thighY, 0]} scale={[tgScale * OFF, llScale, tgScale * OFF]}>
          <cylinderGeometry args={[0.073, 0.063, THIGH_H, 8]} />
          <meshStandardMaterial color={color} roughness={0.88} metalness={0} />
        </mesh>
        {/* Muslo derecho */}
        <mesh position={[0.09, thighY, 0]} scale={[tgScale * OFF, llScale, tgScale * OFF]}>
          <cylinderGeometry args={[0.073, 0.063, THIGH_H, 8]} />
          <meshStandardMaterial color={color} roughness={0.88} metalness={0} />
        </mesh>
        {/* Pantorrilla izquierda */}
        <mesh position={[-0.09, calfY, 0]} scale={[cgScale * OFF, llScale, cgScale * OFF]}>
          <cylinderGeometry args={[0.056, 0.046, CALF_H, 8]} />
          <meshStandardMaterial color={color} roughness={0.88} metalness={0} />
        </mesh>
        {/* Pantorrilla derecha */}
        <mesh position={[0.09, calfY, 0]} scale={[cgScale * OFF, llScale, cgScale * OFF]}>
          <cylinderGeometry args={[0.056, 0.046, CALF_H, 8]} />
          <meshStandardMaterial color={color} roughness={0.88} metalness={0} />
        </mesh>
      </group>
    );
  }

  // ── Vestidos ──────────────────────────────────────────────────────────────────
  if (category === "Vestidos") {
    return (
      <group scale={[1, hScale, 1]}>
        {/* Hombros */}
        <mesh position={[0, 1.32, 0]} scale={[shwScale * OFF, 1.02, OFF]}>
          <boxGeometry args={[0.44, 0.075, 0.21]} />
          <meshStandardMaterial color={color} roughness={0.88} metalness={0} />
        </mesh>
        {/* Torso superior */}
        <mesh position={[0, upperTorsoY, 0]} scale={[bScale * OFF, tlScale, (bScale * 0.6 + 0.4) * OFF]}>
          <cylinderGeometry args={[0.155, 0.112, UPPER_TORSO_H, 10]} />
          <meshStandardMaterial color={color} roughness={0.88} metalness={0} />
        </mesh>
        {/* Brazo superior izquierdo */}
        <group position={[-armX, SHOULDER_Y, 0]} rotation={[0, 0, -ARM_ANGLE]}>
          <mesh position={[0, -(UPPER_ARM_H * aScale) / 2, 0]} scale={[agScale * OFF, aScale, agScale * OFF]}>
            <cylinderGeometry args={[0.065, 0.052, UPPER_ARM_H, 8]} />
            <meshStandardMaterial color={color} roughness={0.88} metalness={0} />
          </mesh>
        </group>
        {/* Brazo superior derecho */}
        <group position={[armX, SHOULDER_Y, 0]} rotation={[0, 0, ARM_ANGLE]}>
          <mesh position={[0, -(UPPER_ARM_H * aScale) / 2, 0]} scale={[agScale * OFF, aScale, agScale * OFF]}>
            <cylinderGeometry args={[0.065, 0.052, UPPER_ARM_H, 8]} />
            <meshStandardMaterial color={color} roughness={0.88} metalness={0} />
          </mesh>
        </group>
        {/* Torso inferior */}
        <mesh position={[0, lowerTorsoY, 0]} scale={[wScale * OFF, tlScale, (wScale * 0.6 + 0.4) * OFF]}>
          <cylinderGeometry args={[0.112, 0.135, LOWER_TORSO_H, 10]} />
          <meshStandardMaterial color={color} roughness={0.88} metalness={0} />
        </mesh>
        {/* Falda A-line: desde cadera hasta media pierna */}
        <mesh position={[0, skirtCenterY, 0]} scale={[hipScale * OFF, llScale, hipScale * OFF]}>
          <cylinderGeometry args={[0.155, 0.248, SKIRT_H, 14]} />
          <meshStandardMaterial color={color} roughness={0.88} metalness={0} />
        </mesh>
      </group>
    );
  }

  // ── Zapatos ───────────────────────────────────────────────────────────────────
  if (category === "Zapatos") {
    return (
      <group scale={[1, hScale, 1]}>
        <mesh position={[-0.09, footY, 0.04]}>
          <boxGeometry args={[0.092, 0.058, 0.21]} />
          <meshStandardMaterial color={color} roughness={0.88} metalness={0} />
        </mesh>
        <mesh position={[0.09, footY, 0.04]}>
          <boxGeometry args={[0.092, 0.058, 0.21]} />
          <meshStandardMaterial color={color} roughness={0.88} metalness={0} />
        </mesh>
      </group>
    );
  }

  // ── Accesorios ────────────────────────────────────────────────────────────────
  if (category === "Accesorios") {
    return (
      <group scale={[1, hScale, 1]}>
        <mesh position={[0, 1.34, 0.12]}>
          <sphereGeometry args={[0.028, 10, 8]} />
          <meshStandardMaterial color={color} roughness={0.4} metalness={0.4} />
        </mesh>
      </group>
    );
  }

  return null;
}
