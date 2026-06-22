"use client";

import type { Measurements } from "@/types";

interface Props {
  measurements: Measurements;
}

const BASE = {
  height: 165, bust: 88, waist: 68, hips: 94, armLength: 58,
  shoulderWidth: 40, torsoLength: 61, legLength: 85,
  armGirth: 28, thighGirth: 55, calfGirth: 36,
};

// ── Torso ─────────────────────────────────────────────────────────────────────
// Ancla en TORSO_TOP_Y (borde inferior de la placa de hombros).
// Cada sección crece hacia abajo; sus centros Y se recalculan para que
// bottom_i == top_{i+1} exactamente para cualquier tlScale.
const TORSO_TOP_Y   = 1.30;
const UPPER_TORSO_H = 0.30;
const LOWER_TORSO_H = 0.20;
const PELVIS_H      = 0.13;

// ── Brazos ────────────────────────────────────────────────────────────────────
// Se usan grupos (<group>) anclados en el hombro: ambos segmentos (brazo
// superior + antebrazo) comparten la misma rotación, eliminando el gap visual
// en el codo que producen rotaciones distintas en meshes independientes.
const SHOULDER_Y = 1.36; // Y donde el brazo sale de la placa de hombros

// Longitudes de segmento
const UPPER_ARM_H = 0.28;
const FOREARM_H   = 0.24; // ligeramente más corto que el brazo superior (más realista)

// Radios — proporciones corregidas para que el brazo no se vea filiforme
// vs el torso (r_torso_top = 0.155):
const UPPER_ARM_R_TOP = 0.065; // ~13cm diámetro en hombro (era 0.048 — muy fino)
const UPPER_ARM_R_BOT = 0.052; // ~10.4cm en codo
const FOREARM_R_TOP   = 0.050; // ~10cm en codo (continuidad natural)
const FOREARM_R_BOT   = 0.034; // ~6.8cm en muñeca

// Ángulo de caída del brazo: inclinación suave hacia fuera (como maniquí en reposo)
const ARM_ANGLE = Math.PI / 18; // ≈ 10°

// ── Piernas ───────────────────────────────────────────────────────────────────
// Ancla en HIP_JOINT_Y (calculada desde el torso → cascada correcta).
const THIGH_H = 0.29;
const CALF_H  = 0.27;
// CALF_CENTER_OFFSET = THIGH_H + gap_rodilla(0.035) + CALF_H/2 = 0.46
// Reproduce la posición hardcodeada original (0.21) con error < 0.005.
const CALF_CENTER_OFFSET = 0.46;

// ── Pies ──────────────────────────────────────────────────────────────────────
// Los pies se anclan al borde inferior de la pantorrilla para que desciendan
// junto con las piernas cuando llScale o tlScale cambian.
const FOOT_H   = 0.05;
const ANKLE_GAP = 0.025; // espacio fijo entre pantorrilla y pie (articulación tobillo)
// CALF_BOTTOM_OFFSET = CALF_CENTER_OFFSET + CALF_H/2 = 0.46 + 0.135 = 0.595
// Es el offset desde HIP_JOINT_Y hasta el borde inferior de la pantorrilla.
const CALF_BOTTOM_OFFSET = CALF_CENTER_OFFSET + CALF_H / 2; // 0.595

const SKIN = "#d4c5b8";

export function MannequinFigure({ measurements }: Props) {
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

  // ── Posiciones Y del torso (ancla: TORSO_TOP_Y) ───────────────────────────
  const upperTorsoY = TORSO_TOP_Y - (UPPER_TORSO_H * tlScale) / 2;
  const lowerTorsoY = TORSO_TOP_Y - UPPER_TORSO_H * tlScale - (LOWER_TORSO_H * tlScale) / 2;
  const pelvisY     = TORSO_TOP_Y - (UPPER_TORSO_H + LOWER_TORSO_H) * tlScale - (PELVIS_H * tlScale) / 2;
  const HIP_JOINT_Y = TORSO_TOP_Y - (UPPER_TORSO_H + LOWER_TORSO_H + PELVIS_H) * tlScale;

  // ── X de los brazos (desplazamiento lateral según ancho de hombros) ────────
  // Arm center en X = 0.22 × shwScale: ligeramente por dentro del borde de la
  // placa de hombros (half-width = 0.22 a escala base), creando la superposición
  // visual correcta en lugar del gap que producía armX = 0.27.
  const armX = 0.22 * shwScale;

  // ── Posiciones Y de piernas (ancla: HIP_JOINT_Y) ──────────────────────────
  const thighY = HIP_JOINT_Y - (THIGH_H * llScale) / 2;
  const calfY  = HIP_JOINT_Y - CALF_CENTER_OFFSET * llScale;

  // ── Posición Y de los pies (ancla: borde inferior de pantorrilla) ──────────
  // footY se recalcula con llScale y tlScale — el pie desciende junto con la pierna.
  // Verificación en valores base (llScale=1, HIP_JOINT_Y=0.67):
  //   footY = 0.67 − 0.595 − 0.025 − 0.025 = 0.025 ✓ (coincide con valor original)
  const footY = HIP_JOINT_Y - CALF_BOTTOM_OFFSET * llScale - ANKLE_GAP - FOOT_H / 2;

  function Mat() {
    return <meshStandardMaterial color={SKIN} roughness={0.65} metalness={0.04} />;
  }

  return (
    <group scale={[1, hScale, 1]}>

      {/* ── Cabeza ── */}
      <mesh position={[0, 1.57, 0]}>
        <sphereGeometry args={[0.11, 16, 12]} />
        <meshStandardMaterial color={SKIN} roughness={0.65} metalness={0.04} />
      </mesh>

      {/* ── Cuello ── */}
      <mesh position={[0, 1.41, 0]}>
        <cylinderGeometry args={[0.055, 0.065, 0.10, 8]} />
        <meshStandardMaterial color={SKIN} roughness={0.65} metalness={0.04} />
      </mesh>

      {/* ── Hombros / placa superior ── */}
      <mesh position={[0, 1.32, 0]} scale={[shwScale, 1, 1]}>
        <boxGeometry args={[0.44, 0.07, 0.20]} />
        <Mat />
      </mesh>

      {/* ── Torso superior (busto) ── */}
      <mesh position={[0, upperTorsoY, 0]} scale={[bScale, tlScale, bScale * 0.6 + 0.4]}>
        <cylinderGeometry args={[0.155, 0.112, UPPER_TORSO_H, 10]} />
        <Mat />
      </mesh>

      {/* ── Torso inferior (cintura) ── */}
      <mesh position={[0, lowerTorsoY, 0]} scale={[wScale, tlScale, wScale * 0.6 + 0.4]}>
        <cylinderGeometry args={[0.112, 0.135, LOWER_TORSO_H, 10]} />
        <Mat />
      </mesh>

      {/* ── Pelvis / cadera ── */}
      <mesh position={[0, pelvisY, 0]} scale={[hipScale, tlScale, hipScale * 0.65 + 0.35]}>
        <cylinderGeometry args={[0.148, 0.142, PELVIS_H, 10]} />
        <Mat />
      </mesh>

      {/*
       * ── Brazo IZQUIERDO ──────────────────────────────────────────────────
       * Grupo anclado en el hombro (SHOULDER_Y). Ambos segmentos comparten
       * la misma rotación → el codo queda matemáticamente exacto en cualquier
       * valor de aScale. Rotación Z negativa = inclinación hacia la izquierda
       * (outward para el brazo izquierdo). armX desplaza el grupo a X = −armX.
       */}
      <group position={[-armX, SHOULDER_Y, 0]} rotation={[0, 0, -ARM_ANGLE]}>
        {/* Brazo superior — centro en local Y = −halfHeight (cuelga desde el hombro) */}
        <mesh
          position={[0, -(UPPER_ARM_H * aScale) / 2, 0]}
          scale={[agScale, aScale, agScale]}
        >
          <cylinderGeometry args={[UPPER_ARM_R_TOP, UPPER_ARM_R_BOT, UPPER_ARM_H, 8]} />
          <Mat />
        </mesh>
        {/* Antebrazo — centro justo bajo el brazo superior */}
        <mesh
          position={[0, -UPPER_ARM_H * aScale - (FOREARM_H * aScale) / 2, 0]}
          scale={[agScale, aScale, agScale]}
        >
          <cylinderGeometry args={[FOREARM_R_TOP, FOREARM_R_BOT, FOREARM_H, 8]} />
          <Mat />
        </mesh>
      </group>

      {/* ── Brazo DERECHO (simétrico) ── */}
      <group position={[armX, SHOULDER_Y, 0]} rotation={[0, 0, ARM_ANGLE]}>
        <mesh
          position={[0, -(UPPER_ARM_H * aScale) / 2, 0]}
          scale={[agScale, aScale, agScale]}
        >
          <cylinderGeometry args={[UPPER_ARM_R_TOP, UPPER_ARM_R_BOT, UPPER_ARM_H, 8]} />
          <Mat />
        </mesh>
        <mesh
          position={[0, -UPPER_ARM_H * aScale - (FOREARM_H * aScale) / 2, 0]}
          scale={[agScale, aScale, agScale]}
        >
          <cylinderGeometry args={[FOREARM_R_TOP, FOREARM_R_BOT, FOREARM_H, 8]} />
          <Mat />
        </mesh>
      </group>

      {/* ── Muslo izquierdo ── */}
      <mesh position={[-0.09, thighY, 0]} scale={[tgScale, llScale, tgScale]}>
        <cylinderGeometry args={[0.073, 0.063, THIGH_H, 8]} />
        <Mat />
      </mesh>

      {/* ── Muslo derecho ── */}
      <mesh position={[0.09, thighY, 0]} scale={[tgScale, llScale, tgScale]}>
        <cylinderGeometry args={[0.073, 0.063, THIGH_H, 8]} />
        <Mat />
      </mesh>

      {/* ── Pantorrilla izquierda ── */}
      <mesh position={[-0.09, calfY, 0]} scale={[cgScale, llScale, cgScale]}>
        <cylinderGeometry args={[0.056, 0.046, CALF_H, 8]} />
        <Mat />
      </mesh>

      {/* ── Pantorrilla derecha ── */}
      <mesh position={[0.09, calfY, 0]} scale={[cgScale, llScale, cgScale]}>
        <cylinderGeometry args={[0.056, 0.046, CALF_H, 8]} />
        <Mat />
      </mesh>

      {/*
       * ── Pies (anclados al borde inferior de la pantorrilla) ──────────────
       * footY se recalcula con llScale (y tlScale vía HIP_JOINT_Y) para que
       * el pie siempre quede pegado a la pantorrilla sin importar la escala.
       */}
      <mesh position={[-0.09, footY, 0.04]}>
        <boxGeometry args={[0.08, FOOT_H, 0.18]} />
        <Mat />
      </mesh>

      <mesh position={[0.09, footY, 0.04]}>
        <boxGeometry args={[0.08, FOOT_H, 0.18]} />
        <Mat />
      </mesh>

    </group>
  );
}
