"use client";

import { useEffect, useMemo } from "react";
import { useGLTF } from "@react-three/drei";
import * as THREE from "three";
import { clone as cloneSkeleton } from "three/examples/jsm/utils/SkeletonUtils.js";

interface Props {
  url: string;
}

// Avatar SDK exporta en T-pose (brazos horizontales). Bajamos los brazos
// rotando los huesos del rig (convención Mixamo: LeftArm/RightArm) para
// una postura de descanso más natural.
const ARM_DROP_DEG = 55; // dentro del rango pedido (45-60°)

// Altura objetivo a la que normalizamos el modelo, para que quepa completo
// en el encuadre de cámara actual sin importar la estatura real de la persona.
const TARGET_HEIGHT_M = 1.7;

const WORLD_Z = new THREE.Vector3(0, 0, 1);

/**
 * Rota un hueso alrededor del eje Z del MUNDO (no del eje local del hueso).
 * El eje local de huesos tipo Mixamo suele venir pre-rotado (para alinearse
 * con la dirección del brazo), así que rotar en local Z puede terminar
 * girando el brazo sobre su propio eje en vez de bajarlo. Rotar en espacio
 * mundial y convertir el resultado a local evita depender de esa orientación.
 */
function rotateBoneAroundWorldZ(bone: THREE.Object3D | undefined, angleRad: number) {
  if (!bone || !bone.parent) return;

  const worldQuat = new THREE.Quaternion();
  bone.getWorldQuaternion(worldQuat);

  const delta = new THREE.Quaternion().setFromAxisAngle(WORLD_Z, angleRad);
  const targetWorldQuat = delta.multiply(worldQuat);

  const parentWorldQuat = new THREE.Quaternion();
  bone.parent.getWorldQuaternion(parentWorldQuat);

  const localQuat = parentWorldQuat.invert().multiply(targetWorldQuat);
  bone.quaternion.copy(localQuat);
}

function lowerArmsFromTPose(root: THREE.Object3D) {
  const leftArm = root.getObjectByName("LeftArm");
  const rightArm = root.getObjectByName("RightArm");
  const rad = THREE.MathUtils.degToRad(ARM_DROP_DEG);
  rotateBoneAroundWorldZ(leftArm, -rad);
  rotateBoneAroundWorldZ(rightArm, rad);
}

export function AvatarModel({ url }: Props) {
  const { scene } = useGLTF(url);

  // TEMP DEBUG — quitar después de confirmar en consola
  useEffect(() => {
    if (!scene) return;
    scene.traverse((obj) => {
      if (obj.type === "Bone" || obj.name.includes("arm") || obj.name.includes("Arm")) {
        console.log("[GLB Bone]", obj.type, obj.name);
      }
    });
    scene.traverse((obj) => {
      console.log("[GLB Object]", obj.type, obj.name);
    });
  }, [scene]);

  const model = useMemo(() => {
    // scene.clone(true) NO re-vincula el skeleton de un SkinnedMesh a los
    // huesos clonados (bug conocido de Three.js) — rotar huesos del clon no
    // tenía ningún efecto visual porque el mesh seguía usando el skeleton
    // original. SkeletonUtils.clone() sí clona y re-vincula correctamente.
    const clone = cloneSkeleton(scene);

    // Asegura que las matrices de mundo reflejen la bind pose ANTES de leer
    // getWorldQuaternion() en lowerArmsFromTPose (si no, se lee identidad).
    clone.updateMatrixWorld(true);
    lowerArmsFromTPose(clone);
    clone.updateMatrixWorld(true);

    // Fuerza a usar los materiales/texturas originales del GLB tal cual
    // vienen (nada los sobreescribe con un color sólido en este componente).
    clone.traverse((obj) => {
      if ((obj as THREE.Mesh).isMesh) {
        const mesh = obj as THREE.Mesh;
        const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
        materials.forEach((mat) => {
          if (mat) mat.needsUpdate = true;
        });
      }
    });

    // Normaliza la altura (box "precise" para que considere la deformación
    // real del skinning, no solo la geometría en bind pose).
    const rawBox = new THREE.Box3().setFromObject(clone, true);
    const rawHeight = rawBox.max.y - rawBox.min.y;
    if (rawHeight > 0) {
      const scaleFactor = TARGET_HEIGHT_M / rawHeight;
      clone.scale.setScalar(scaleFactor);
      clone.updateMatrixWorld(true);
    }

    // Centra en X/Z y asienta los pies en y=0 (mismo suelo que el maniquí).
    const box = new THREE.Box3().setFromObject(clone, true);
    const center = box.getCenter(new THREE.Vector3());
    clone.position.x -= center.x;
    clone.position.z -= center.z;
    clone.position.y -= box.min.y;

    return clone;
  }, [scene]);

  return <primitive object={model} />;
}
