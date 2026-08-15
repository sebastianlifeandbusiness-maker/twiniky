"use client";

import { useMemo } from "react";
import { useGLTF } from "@react-three/drei";
import * as THREE from "three";

interface Props {
  url: string;
}

export function AvatarModel({ url }: Props) {
  const { scene } = useGLTF(url);

  const model = useMemo(() => {
    const clone = scene.clone(true);
    const box = new THREE.Box3().setFromObject(clone);
    const center = box.getCenter(new THREE.Vector3());
    clone.position.x -= center.x;
    clone.position.z -= center.z;
    clone.position.y -= box.min.y;
    return clone;
  }, [scene]);

  return <primitive object={model} />;
}
