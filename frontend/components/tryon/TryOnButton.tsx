"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface Props {
  productId: string;
}

export function TryOnButton({ productId }: Props) {
  const router = useRouter();
  const [hov, setHov] = useState(false);

  return (
    <button
      onClick={() => router.push(`/tryon?product=${productId}`)}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        width: "100%",
        padding: "12px 0",
        fontSize: 10,
        fontWeight: 700,
        letterSpacing: "0.2em",
        textTransform: "uppercase",
        border: "2px solid #111",
        backgroundColor: hov ? "#111" : "transparent",
        color: hov ? "#fff" : "#111",
        cursor: "pointer",
        borderRadius: 4,
        transition: "background-color 0.2s, color 0.2s",
      }}
    >
      Probar en 3D
    </button>
  );
}
