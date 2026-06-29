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
const TORSO_TOP_Y   = 1.30;
const UPPER_TORSO_H = 0.30;
const LOWER_TORSO_H = 0.20;
const PELVIS_H      = 0.13;

// ── Brazos ────────────────────────────────────────────────────────────────────
const SHOULDER_Y = 1.36;

const UPPER_ARM_H = 0.28;
const FOREARM_H   = 0.24;

const UPPER_ARM_R_TOP = 0.065;
const UPPER_ARM_R_BOT = 0.052;
const FOREARM_R_TOP   = 0.050;
const FOREARM_R_BOT   = 0.034;

const ARM_ANGLE = Math.PI / 18;

// ── Piernas ───────────────────────────────────────────────────────────────────
const THIGH_H = 0.29;
const CALF_H  = 0.27;
const CALF_CENTER_OFFSET = 0.46;

// ── Pies ──────────────────────────────────────────────────────────────────────
const FOOT_H   = 0.05;
const ANKLE_GAP = 0.025;
const CALF_BOTTOM_OFFSET = CALF_CENTER_OFFSET + CALF_H / 2; // 0.595

const SKIN = "#d4c5b8";

export type ProfileMults = {
  shoulderMult: number;
  hipMult: number;
  waistMult: number;
  headScale: number;
  volumeMult: number;
};

export function getBaseProportions(
  sex: string | null | undefined,
  ageGroup: string | null | undefined,
  bodyType: string | null | undefined,
  weight: number | null | undefined,
  height: number,
): ProfileMults {
  let shoulderMult = 1.0;
  let hipMult      = 1.0;
  let waistMult    = 1.0;
  let headScale    = 1.0;
  let volumeMult   = 1.0;

  // Proporciones por sexo
  if (sex === "male") {
    shoulderMult = 1.15;
    hipMult      = 0.90;
    waistMult    = 1.05;
  } else if (sex === "female") {
    shoulderMult = 0.90;
    hipMult      = 1.15;
    waistMult    = 0.85;
  }

  // Grupo de edad — cabeza más grande en niños, suaviza diferencias sexuales
  if (ageGroup === "child") {
    headScale    = 1.30;
    shoulderMult = (shoulderMult + 1.0) / 2;
    hipMult      = (hipMult      + 1.0) / 2;
    waistMult    = (waistMult    + 1.0) / 2;
  } else if (ageGroup === "teen") {
    headScale    = 1.10;
    shoulderMult = (shoulderMult * 2 + 1.0) / 3;
    hipMult      = (hipMult      * 2 + 1.0) / 3;
    waistMult    = (waistMult    * 2 + 1.0) / 3;
  } else if (ageGroup === "senior") {
    volumeMult *= 1.05;
  }

  // Contextura corporal
  const volumeByType: Record<string, number> = {
    slim: 0.85, normal: 1.0, athletic: 1.1, overweight: 1.25,
  };
  if (bodyType && volumeByType[bodyType] !== undefined) {
    volumeMult *= volumeByType[bodyType];
  }

  // Refinamiento por IMC (ajuste fino sobre la contextura)
  if (weight != null && height > 0) {
    const bmi = weight / ((height / 100) ** 2);
    if (bmi < 18.5)              volumeMult *= 0.95;
    else if (bmi >= 25 && bmi < 30) volumeMult *= 1.05;
    else if (bmi >= 30)          volumeMult *= 1.10;
  }

  return { shoulderMult, hipMult, waistMult, headScale, volumeMult };
}

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

  // Multiplicadores de perfil (sexo, edad, contextura, peso)
  const profs = getBaseProportions(
    measurements.sex, measurements.ageGroup, measurements.bodyType,
    measurements.weight, measurements.height,
  );

  // Escalas efectivas: longitudes (Y) vienen solo de medidas; volumen/forma (X/Z) incluye perfil
  const effectiveBScale   = bScale   * profs.volumeMult;
  const effectiveWScale   = wScale   * profs.waistMult   * profs.volumeMult;
  const effectiveHipScale = hipScale * profs.hipMult     * profs.volumeMult;
  const effectiveShwScale = shwScale * profs.shoulderMult;
  const effectiveAgScale  = agScale  * profs.volumeMult;
  const effectiveTgScale  = tgScale  * profs.volumeMult;
  const effectiveCgScale  = cgScale  * profs.volumeMult;

  // ── Posiciones Y del torso (ancla: TORSO_TOP_Y) ───────────────────────────
  const upperTorsoY = TORSO_TOP_Y - (UPPER_TORSO_H * tlScale) / 2;
  const lowerTorsoY = TORSO_TOP_Y - UPPER_TORSO_H * tlScale - (LOWER_TORSO_H * tlScale) / 2;
  const pelvisY     = TORSO_TOP_Y - (UPPER_TORSO_H + LOWER_TORSO_H) * tlScale - (PELVIS_H * tlScale) / 2;
  const HIP_JOINT_Y = TORSO_TOP_Y - (UPPER_TORSO_H + LOWER_TORSO_H + PELVIS_H) * tlScale;

  // X de los brazos
  const armX = 0.22 * effectiveShwScale;

  // ── Posiciones Y de piernas ────────────────────────────────────────────────
  const thighY = HIP_JOINT_Y - (THIGH_H * llScale) / 2;
  const calfY  = HIP_JOINT_Y - CALF_CENTER_OFFSET * llScale;
  const footY  = HIP_JOINT_Y - CALF_BOTTOM_OFFSET * llScale - ANKLE_GAP - FOOT_H / 2;

  function Mat() {
    return <meshStandardMaterial color={SKIN} roughness={0.65} metalness={0.04} />;
  }

  return (
    <group scale={[1, hScale, 1]}>

      {/* ── Cabeza — escala adicional por grupo de edad ── */}
      <mesh position={[0, 1.57, 0]} scale={[profs.headScale, profs.headScale, profs.headScale]}>
        <sphereGeometry args={[0.11, 16, 12]} />
        <meshStandardMaterial color={SKIN} roughness={0.65} metalness={0.04} />
      </mesh>

      {/* ── Cuello ── */}
      <mesh position={[0, 1.41, 0]}>
        <cylinderGeometry args={[0.055, 0.065, 0.10, 8]} />
        <meshStandardMaterial color={SKIN} roughness={0.65} metalness={0.04} />
      </mesh>

      {/* ── Hombros / placa superior ── */}
      <mesh position={[0, 1.32, 0]} scale={[effectiveShwScale, 1, 1]}>
        <boxGeometry args={[0.44, 0.07, 0.20]} />
        <Mat />
      </mesh>

      {/* ── Torso superior (busto) ── */}
      <mesh position={[0, upperTorsoY, 0]} scale={[effectiveBScale, tlScale, effectiveBScale * 0.6 + 0.4]}>
        <cylinderGeometry args={[0.155, 0.112, UPPER_TORSO_H, 10]} />
        <Mat />
      </mesh>

      {/* ── Torso inferior (cintura) ── */}
      <mesh position={[0, lowerTorsoY, 0]} scale={[effectiveWScale, tlScale, effectiveWScale * 0.6 + 0.4]}>
        <cylinderGeometry args={[0.112, 0.135, LOWER_TORSO_H, 10]} />
        <Mat />
      </mesh>

      {/* ── Pelvis / cadera ── */}
      <mesh position={[0, pelvisY, 0]} scale={[effectiveHipScale, tlScale, effectiveHipScale * 0.65 + 0.35]}>
        <cylinderGeometry args={[0.148, 0.142, PELVIS_H, 10]} />
        <Mat />
      </mesh>

      {/* ── Brazo IZQUIERDO ── */}
      <group position={[-armX, SHOULDER_Y, 0]} rotation={[0, 0, -ARM_ANGLE]}>
        <mesh
          position={[0, -(UPPER_ARM_H * aScale) / 2, 0]}
          scale={[effectiveAgScale, aScale, effectiveAgScale]}
        >
          <cylinderGeometry args={[UPPER_ARM_R_TOP, UPPER_ARM_R_BOT, UPPER_ARM_H, 8]} />
          <Mat />
        </mesh>
        <mesh
          position={[0, -UPPER_ARM_H * aScale - (FOREARM_H * aScale) / 2, 0]}
          scale={[effectiveAgScale, aScale, effectiveAgScale]}
        >
          <cylinderGeometry args={[FOREARM_R_TOP, FOREARM_R_BOT, FOREARM_H, 8]} />
          <Mat />
        </mesh>
      </group>

      {/* ── Brazo DERECHO (simétrico) ── */}
      <group position={[armX, SHOULDER_Y, 0]} rotation={[0, 0, ARM_ANGLE]}>
        <mesh
          position={[0, -(UPPER_ARM_H * aScale) / 2, 0]}
          scale={[effectiveAgScale, aScale, effectiveAgScale]}
        >
          <cylinderGeometry args={[UPPER_ARM_R_TOP, UPPER_ARM_R_BOT, UPPER_ARM_H, 8]} />
          <Mat />
        </mesh>
        <mesh
          position={[0, -UPPER_ARM_H * aScale - (FOREARM_H * aScale) / 2, 0]}
          scale={[effectiveAgScale, aScale, effectiveAgScale]}
        >
          <cylinderGeometry args={[FOREARM_R_TOP, FOREARM_R_BOT, FOREARM_H, 8]} />
          <Mat />
        </mesh>
      </group>

      {/* ── Muslo izquierdo ── */}
      <mesh position={[-0.09, thighY, 0]} scale={[effectiveTgScale, llScale, effectiveTgScale]}>
        <cylinderGeometry args={[0.073, 0.063, THIGH_H, 8]} />
        <Mat />
      </mesh>

      {/* ── Muslo derecho ── */}
      <mesh position={[0.09, thighY, 0]} scale={[effectiveTgScale, llScale, effectiveTgScale]}>
        <cylinderGeometry args={[0.073, 0.063, THIGH_H, 8]} />
        <Mat />
      </mesh>

      {/* ── Pantorrilla izquierda ── */}
      <mesh position={[-0.09, calfY, 0]} scale={[effectiveCgScale, llScale, effectiveCgScale]}>
        <cylinderGeometry args={[0.056, 0.046, CALF_H, 8]} />
        <Mat />
      </mesh>

      {/* ── Pantorrilla derecha ── */}
      <mesh position={[0.09, calfY, 0]} scale={[effectiveCgScale, llScale, effectiveCgScale]}>
        <cylinderGeometry args={[0.056, 0.046, CALF_H, 8]} />
        <Mat />
      </mesh>

      {/* ── Pies ── */}
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
