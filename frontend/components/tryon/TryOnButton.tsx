"use client";

import { useRouter } from "next/navigation";

interface Props {
  productId: string;
}

export function TryOnButton({ productId }: Props) {
  const router = useRouter();

  return (
    <button
      onClick={() => router.push(`/tryon?product=${productId}`)}
      className="w-full rounded-xl border-2 border-black py-3 font-semibold hover:bg-black hover:text-white transition"
    >
      Probar en 3D
    </button>
  );
}
