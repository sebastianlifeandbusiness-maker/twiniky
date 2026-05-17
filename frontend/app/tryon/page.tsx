"use client";

import { Suspense } from "react";
import { TryOnViewer } from "@/components/tryon/TryOnViewer";

export default function TryOnPage() {
  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      <h1 className="text-3xl font-bold mb-6">Probador Virtual 3D</h1>
      <Suspense fallback={<div className="h-96 bg-gray-100 rounded-2xl animate-pulse" />}>
        <TryOnViewer />
      </Suspense>
    </div>
  );
}
