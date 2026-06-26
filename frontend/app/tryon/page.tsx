"use client";

import dynamic from "next/dynamic";
import { Suspense, useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { BodyCapture } from "@/components/tryon/BodyCapture";
import { avatarApi, apiToMeasurements } from "@/lib/api";
import { useAuthStore } from "@/lib/store/auth";
import { useBrandStore } from "@/lib/store/brand";
import type { Measurements } from "@/types";

const TryOnViewer = dynamic(
  () => import("@/components/tryon/TryOnViewer").then((m) => ({ default: m.TryOnViewer })),
  {
    ssr: false,
    loading: () => (
      <div
        style={{
          height: 580,
          backgroundColor: "#f5f5f3",
          borderRadius: 12,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#bbb",
          fontSize: 12,
          letterSpacing: "0.1em",
        }}
      >
        Cargando probador 3D…
      </div>
    ),
  }
);

const DEFAULT_MEASUREMENTS: Measurements = {
  height: 165, bust: 88, waist: 68, hips: 94,
  armLength: 58, shoeSize: 39, shoulderWidth: 40,
  torsoLength: 61, legLength: 85, armGirth: 28,
  thighGirth: 55, calfGirth: 36,
};

function TryOnContent() {
  const searchParams = useSearchParams();
  const productId = searchParams.get("product");
  const router = useRouter();
  const { token } = useAuthStore();
  const { token: brandToken } = useBrandStore();

  const [step, setStep] = useState<"loading" | "capture" | "viewer">("loading");
  const [measurements, setMeasurements] = useState<Measurements>(DEFAULT_MEASUREMENTS);

  useEffect(() => {
    if (!token && !brandToken) {
      router.replace("/login?message=tryon");
      return;
    }
    if (brandToken && !token) {
      // Marcas no tienen avatar configurado → viewer con medidas por defecto
      setStep("viewer");
      return;
    }
    avatarApi.get()
      .then(({ data }) => {
        setMeasurements(apiToMeasurements(data));
        setStep("viewer");
      })
      .catch(() => {
        setStep("capture");
      });
  }, [token, brandToken, router]);

  if (step === "loading") {
    return (
      <div
        style={{
          height: 300,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#bbb",
          fontSize: 12,
          letterSpacing: "0.1em",
        }}
      >
        Cargando…
      </div>
    );
  }

  if (step === "capture") {
    return (
      <BodyCapture
        defaultMeasurements={DEFAULT_MEASUREMENTS}
        onComplete={(m) => {
          setMeasurements(m);
          setStep("viewer");
        }}
      />
    );
  }

  return (
    <TryOnViewer
      measurements={measurements}
      onChangeMeasurements={setMeasurements}
      productId={productId ?? null}
    />
  );
}

export default function TryOnPage() {
  return (
    <main style={{ maxWidth: 1200, margin: "0 auto", padding: "40px 24px 80px" }}>
      <h1
        style={{
          margin: "0 0 32px",
          fontSize: 20,
          fontWeight: 700,
          letterSpacing: "0.14em",
          textTransform: "uppercase",
          color: "#111",
        }}
      >
        Probador Virtual 3D
      </h1>
      <Suspense
        fallback={
          <div
            style={{
              height: 520,
              backgroundColor: "#f5f5f3",
              borderRadius: 12,
            }}
          />
        }
      >
        <TryOnContent />
      </Suspense>
    </main>
  );
}
